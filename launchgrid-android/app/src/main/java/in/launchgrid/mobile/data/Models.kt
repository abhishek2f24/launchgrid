package `in`.launchgrid.mobile.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull

// ---- Supabase auth ----

@Serializable
data class AuthUser(val id: String = "", val email: String? = null)

@Serializable
data class AuthSession(
    val access_token: String,
    val refresh_token: String,
    val expires_in: Long = 3600,
    val expires_at: Long? = null,
    val user: AuthUser? = null,
)

// ---- LaunchGrid API ----

@Serializable
data class Plan(
    val tier: String = "",
    val public_name: String = "—",
    val status: String = "",
    val current_period_end: String? = null,
)

@Serializable
data class LimitsUsed(val products: Int = 0)

@Serializable
data class Entitlements(
    val tenant_id: String,
    val store_name: String = "",
    val subdomain: String = "",
    val plan: Plan = Plan(),
    val features: JsonObject = JsonObject(emptyMap()),
    val limits_used: LimitsUsed = LimitsUsed(),
) {
    val maxProducts: Long?
        get() = (features["max_products"] as? JsonPrimitive)?.longOrNull
}

// ---- Store data (PostgREST reads under RLS) ----

@Serializable
data class Order(
    val id: String,
    val total_amount: Double = 0.0,
    val payment_status: String = "",
    val fulfillment_status: String = "",
    val customer_name: String? = null,
    val customer_phone: String? = null,
    val created_at: String = "",
    val payment_method: String? = null,
)

@Serializable
data class ProductRef(val title: String = "", val image_urls: List<String>? = null)

@Serializable
data class OrderItem(
    val quantity: Int = 1,
    val price_at_purchase: Double = 0.0,
    val variant_title: String? = null,
    val products: ProductRef? = null,
)

@Serializable
data class OrderDetail(
    val id: String,
    val total_amount: Double = 0.0,
    val payment_status: String = "",
    val fulfillment_status: String = "",
    val customer_name: String? = null,
    val customer_phone: String? = null,
    val created_at: String = "",
    val payment_method: String? = null,
    val shipping_address: JsonElement? = null,
    val order_items: List<OrderItem> = emptyList(),
) {
    /** shipping_address may be plain text or a JSON object — render either. */
    val shippingAddressText: String?
        get() = when (val a = shipping_address) {
            null -> null
            is JsonPrimitive -> a.content.takeIf { it.isNotBlank() }
            else -> runCatching {
                a.jsonObject.values
                    .mapNotNull { (it as? JsonPrimitive)?.content?.takeIf { v -> v.isNotBlank() } }
                    .joinToString(", ")
            }.getOrNull()?.takeIf { it.isNotBlank() }
        }
}

@Serializable
data class Product(
    val id: String,
    val title: String = "",
    val retail_price: Double = 0.0,
    val stock: Int = 0,
    val image_urls: List<String>? = null,
    val is_active: Boolean = true,
)

data class TodayStats(val visitors: Int = 0, val orders: Int = 0, val revenue: Double = 0.0)
