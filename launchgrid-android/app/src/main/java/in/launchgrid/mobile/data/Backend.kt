package `in`.launchgrid.mobile.data

import `in`.launchgrid.mobile.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.put
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import java.io.IOException
import java.time.LocalDate
import java.time.ZoneId
import java.util.concurrent.TimeUnit

private const val SUPABASE = BuildConfig.SUPABASE_URL
private const val ANON_KEY = BuildConfig.SUPABASE_ANON_KEY
private const val API_BASE = BuildConfig.API_BASE
private const val APP_VERSION = "1.0.0"

val json = Json {
    ignoreUnknownKeys = true
    coerceInputValues = true
    isLenient = true
}

private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()

class BackendException(message: String) : Exception(message)

private fun networkError(): Nothing =
    throw BackendException("No connection — check your internet and try again.")

/**
 * Supabase GoTrue auth over REST: password sign-in + silent refresh.
 * Single-flight refresh guarded by a mutex.
 */
class AuthClient(private val store: SessionStore, private val client: OkHttpClient) {

    private val refreshMutex = Mutex()

    suspend fun signIn(email: String, password: String): Result<Unit> = runCatching {
        val body = buildJsonObject {
            put("email", email)
            put("password", password)
        }
        val res = execute(authRequest("password", body))
        res.use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) throw BackendException(authErrorMessage(text, it.code))
            store.save(json.decodeFromString<AuthSession>(text))
        }
    }

    /** Returns a token valid for at least the next 60 seconds, refreshing if needed. */
    suspend fun validToken(): String? {
        val now = System.currentTimeMillis() / 1000
        if (store.accessToken != null && store.expiresAt - 60 > now) return store.accessToken
        val refreshToken = store.refreshToken ?: return null
        return refreshMutex.withLock {
            // Re-check: another caller may have refreshed while we waited.
            val nowLocked = System.currentTimeMillis() / 1000
            if (store.accessToken != null && store.expiresAt - 60 > nowLocked) {
                return@withLock store.accessToken
            }
            val body = buildJsonObject { put("refresh_token", refreshToken) }
            runCatching {
                val res = execute(authRequest("refresh_token", body))
                res.use {
                    val text = it.body?.string().orEmpty()
                    if (!it.isSuccessful) throw BackendException(authErrorMessage(text, it.code))
                    store.save(json.decodeFromString<AuthSession>(text))
                }
            }.onFailure {
                // Refresh token revoked/expired → drop the session so UI returns to login.
                if (it is BackendException) store.clear()
            }
            store.accessToken
        }
    }

    fun signOut() = store.clear()

    private fun authRequest(grantType: String, body: JsonObject): Request =
        Request.Builder()
            .url("$SUPABASE/auth/v1/token?grant_type=$grantType")
            .header("apikey", ANON_KEY)
            .post(body.toString().toRequestBody(JSON_MEDIA))
            .build()

    private suspend fun execute(request: Request): Response = withContext(Dispatchers.IO) {
        try {
            client.newCall(request).execute()
        } catch (_: IOException) {
            networkError()
        }
    }

    private fun authErrorMessage(body: String, code: Int): String = runCatching {
        val obj = json.parseToJsonElement(body).jsonObject
        (obj["error_description"] ?: obj["msg"] ?: obj["message"])
            ?.jsonPrimitive?.content
    }.getOrNull() ?: when (code) {
        400, 401 -> "Invalid email or password."
        else -> "Sign-in failed (HTTP $code)."
    }
}

/**
 * Data access following the platform's architecture rules:
 * - reads go to Supabase PostgREST under RLS
 * - ALL business-logic writes go through the launchgrid.in API with Bearer auth
 */
class Repo(private val auth: AuthClient, private val client: OkHttpClient) {

    // ---- Reads (PostgREST, RLS-scoped) ----

    suspend fun orders(tenantId: String): Result<List<Order>> = pgList(
        "orders?select=id,total_amount,payment_status,fulfillment_status,customer_name," +
            "customer_phone,created_at,payment_method&tenant_id=eq.$tenantId" +
            "&order=created_at.desc&limit=100"
    )

    suspend fun orderDetail(orderId: String): Result<OrderDetail> =
        pgList<OrderDetail>(
            "orders?select=*,order_items(quantity,price_at_purchase,variant_title," +
                "products(title,image_urls))&id=eq.$orderId&limit=1"
        ).mapCatching { it.firstOrNull() ?: throw BackendException("Order not found") }

    suspend fun products(tenantId: String): Result<List<Product>> = pgList(
        "products?select=id,title,retail_price,stock,image_urls,is_active" +
            "&tenant_id=eq.$tenantId&order=created_at.desc&limit=200"
    )

    suspend fun todayStats(tenantId: String): Result<TodayStats> = runCatching {
        val startIso = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant().toString()

        val visitors = pgCount(
            "store_events?select=id&store_id=eq.$tenantId" +
                "&event_type=eq.page_view&created_at=gte.$startIso"
        )

        val todayOrdersJson = pgRaw("orders?select=total_amount&tenant_id=eq.$tenantId&created_at=gte.$startIso")
        val amounts = json.parseToJsonElement(todayOrdersJson).jsonArray.mapNotNull {
            (it.jsonObject["total_amount"] as? JsonPrimitive)?.doubleOrNull
        }
        TodayStats(visitors = visitors, orders = amounts.size, revenue = amounts.sum())
    }

    // ---- Writes (launchgrid.in API only) ----

    suspend fun entitlements(): Result<Entitlements> = apiCall("GET", "/api/v1/entitlements")
        .mapCatching { json.decodeFromJsonElement(Entitlements.serializer(), it) }

    /**
     * Create a product via the shared API (enforces tenant + slug). The endpoint
     * doesn't take stock, so callers set the starting stock with [setProductStock]
     * on the returned id. Returns the new product's id.
     */
    suspend fun addProduct(title: String, retailPrice: Double, costPrice: Double?): Result<String> =
        apiCall(
            "POST", "/api/products/add",
            body = buildJsonObject {
                put("title", title)
                put("retail_price", retailPrice)
                if (costPrice != null) put("cost_price", costPrice)
            },
        ).mapCatching { el ->
            val product = (el as? JsonObject)?.get("product")?.jsonObject
                ?: throw BackendException("Product created but response was unexpected")
            product["id"]?.jsonPrimitive?.content
                ?: throw BackendException("Product created but no id returned")
        }

    /**
     * Set a product's stock. Direct PostgREST PATCH under RLS — the products
     * policy only lets a tenant owner update their own rows, so this is safe
     * without a dedicated API endpoint (stock is a simple owner-scoped field,
     * not a cross-tenant business action like checkout/fulfilment).
     */
    suspend fun setProductStock(productId: String, newStock: Int): Result<Unit> = runCatching {
        val token = auth.validToken() ?: throw BackendException("Signed out")
        val body = buildJsonObject { put("stock", newStock) }
        val req = Request.Builder()
            .url("$SUPABASE/rest/v1/products?id=eq.$productId")
            .header("apikey", ANON_KEY)
            .header("Authorization", "Bearer $token")
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .patch(body.toString().toRequestBody(JSON_MEDIA))
            .build()
        executeIo(req).use {
            if (!it.isSuccessful) throw BackendException("Could not update stock (HTTP ${it.code})")
        }
    }

    suspend fun updateOrderStatus(orderId: String, fulfillmentStatus: String): Result<Unit> =
        apiCall(
            "POST", "/api/orders/update-status",
            body = buildJsonObject {
                put("orderId", orderId)
                put("fulfillmentStatus", fulfillmentStatus)
            },
            idempotencyKey = "$orderId:$fulfillmentStatus",
        ).map { }

    suspend fun deleteAccount(): Result<Unit> =
        apiCall("DELETE", "/api/v1/account", body = buildJsonObject { put("confirm", "DELETE") })
            .map { }

    suspend fun registerDevice(pushToken: String, deviceName: String): Result<Unit> =
        apiCall(
            "POST", "/api/v1/devices",
            body = buildJsonObject {
                put("push_token", pushToken)
                put("platform", "android")
                put("device_name", deviceName)
                put("app_version", APP_VERSION)
            },
        ).map { }

    suspend fun unregisterDevice(pushToken: String): Result<Unit> =
        apiCall("DELETE", "/api/v1/devices", body = buildJsonObject { put("push_token", pushToken) })
            .map { }

    // ---- Helpers ----

    private suspend inline fun <reified T> pgList(pathQuery: String): Result<List<T>> =
        runCatching { json.decodeFromString<List<T>>(pgRaw(pathQuery)) }

    private suspend fun pgRaw(pathQuery: String): String {
        val token = auth.validToken() ?: throw BackendException("Signed out")
        val req = Request.Builder()
            .url("$SUPABASE/rest/v1/$pathQuery")
            .header("apikey", ANON_KEY)
            .header("Authorization", "Bearer $token")
            .get()
            .build()
        return executeIo(req).use {
            val text = it.body?.string().orEmpty()
            if (!it.isSuccessful) throw BackendException("Could not load data (HTTP ${it.code})")
            text
        }
    }

    /** Exact row count via Content-Range, fetching no rows. */
    private suspend fun pgCount(pathQuery: String): Int {
        val token = auth.validToken() ?: throw BackendException("Signed out")
        val req = Request.Builder()
            .url("$SUPABASE/rest/v1/$pathQuery")
            .header("apikey", ANON_KEY)
            .header("Authorization", "Bearer $token")
            .header("Prefer", "count=exact")
            .header("Range", "0-0")
            .get()
            .build()
        return executeIo(req).use {
            // Content-Range: "0-0/123" or "*/0"
            it.header("Content-Range")?.substringAfter('/')?.toIntOrNull() ?: 0
        }
    }

    /**
     * Typed call to the shared Next.js API. Supports both the v1 `{data, error}`
     * envelope and legacy raw payloads — same behaviour as the old client.
     */
    private suspend fun apiCall(
        method: String,
        path: String,
        body: JsonObject? = null,
        idempotencyKey: String? = null,
    ): Result<kotlinx.serialization.json.JsonElement> = runCatching {
        val token = auth.validToken() ?: throw BackendException("Signed out")
        val builder = Request.Builder()
            .url("$API_BASE$path")
            .header("Content-Type", "application/json")
            .header("x-app-version", APP_VERSION)
            .header("Authorization", "Bearer $token")
        idempotencyKey?.let { builder.header("Idempotency-Key", it) }
        builder.method(method, body?.toString()?.toRequestBody(JSON_MEDIA))

        executeIo(builder.build()).use { res ->
            val text = res.body?.string().orEmpty()
            val parsed = runCatching { json.parseToJsonElement(text) }.getOrNull()
            val obj = parsed as? JsonObject

            if (!res.isSuccessful) {
                val message = obj?.get("error")?.let { err ->
                    (err as? JsonObject)?.get("message")?.jsonPrimitive?.content
                        ?: (err as? JsonPrimitive)?.content
                } ?: (obj?.get("message") as? JsonPrimitive)?.content
                throw BackendException(message ?: "Request failed (HTTP ${res.code})")
            }

            when {
                obj != null && (obj.containsKey("data") || obj.containsKey("error")) -> {
                    (obj["error"] as? JsonObject)?.get("message")?.jsonPrimitive?.content
                        ?.let { throw BackendException(it) }
                    obj["data"] ?: JsonObject(emptyMap())
                }
                else -> parsed ?: JsonObject(emptyMap())
            }
        }
    }

    private suspend fun executeIo(request: Request): Response = withContext(Dispatchers.IO) {
        try {
            client.newCall(request).execute()
        } catch (_: IOException) {
            networkError()
        }
    }
}

/** Manual dependency graph — tiny app, no DI framework needed. */
object Graph {
    lateinit var store: SessionStore
        private set
    lateinit var auth: AuthClient
        private set
    lateinit var repo: Repo
        private set

    fun init(context: android.content.Context) {
        if (::store.isInitialized) return
        val client = OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()
        store = SessionStore(context.applicationContext)
        auth = AuthClient(store, client)
        repo = Repo(auth, client)
    }
}
