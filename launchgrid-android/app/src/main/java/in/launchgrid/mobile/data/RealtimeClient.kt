package `in`.launchgrid.mobile.data

import `in`.launchgrid.mobile.BuildConfig
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.addJsonObject
import kotlinx.serialization.json.buildJsonArray
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit

class RealtimeClient(
    private val tenantId: String,
    private val onUpdate: () -> Unit
) {
    private val client = OkHttpClient.Builder()
        .pingInterval(30, TimeUnit.SECONDS)
        .build()

    private val scope = CoroutineScope(Dispatchers.Default)
    private var webSocket: WebSocket? = null
    private var heartbeatJob: Job? = null
    private var ref = 1

    fun connect() {
        if (webSocket != null) return

        val supabaseUrl = BuildConfig.SUPABASE_URL.replace("https://", "wss://")
        val url = "$supabaseUrl/realtime/v1/websocket?apikey=${BuildConfig.SUPABASE_ANON_KEY}&vsn=1.0.0"

        val request = Request.Builder().url(url).build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: Response) {
                Log.d("RealtimeClient", "Connected to Supabase Realtime WebSocket")
                joinChannel()
                startHeartbeat()
            }

            override fun onMessage(webSocket: WebSocket, text: String) {
                Log.d("RealtimeClient", "Received Realtime message: $text")
                // Phoenix event "postgres_changes" indicates database change notification
                if (text.contains("postgres_changes")) {
                    onUpdate()
                }
            }

            override fun onClosing(webSocket: WebSocket, code: Int, reason: String) {
                Log.d("RealtimeClient", "WebSocket closing: $code / $reason")
            }

            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                Log.d("RealtimeClient", "WebSocket closed. Retrying connection in 5s...")
                disconnect()
                scope.launch {
                    delay(5000)
                    connect()
                }
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                Log.e("RealtimeClient", "WebSocket failure", t)
                disconnect()
                scope.launch {
                    delay(5000)
                    connect()
                }
            }
        })
    }

    private fun joinChannel() {
        val joinRef = ref++
        val joinPayload = buildJsonObject {
            put("topic", "realtime:tenant:$tenantId")
            put("event", "phx_join")
            put("payload", buildJsonObject {
                put("config", buildJsonObject {
                    put("postgres_changes", buildJsonArray {
                        addJsonObject {
                            put("event", "*")
                            put("schema", "public")
                            put("table", "research_report_requests")
                            put("filter", "tenant_id=eq.$tenantId")
                        }
                        addJsonObject {
                            put("event", "*")
                            put("schema", "public")
                            put("table", "research_credit_ledger")
                            put("filter", "tenant_id=eq.$tenantId")
                        }
                        addJsonObject {
                            put("event", "*")
                            put("schema", "public")
                            put("table", "orders")
                            put("filter", "tenant_id=eq.$tenantId")
                        }
                    })
                })
            })
            put("ref", joinRef.toString())
        }
        webSocket?.send(joinPayload.toString())
    }

    private fun startHeartbeat() {
        heartbeatJob?.cancel()
        heartbeatJob = scope.launch {
            while (true) {
                delay(30000)
                val beatRef = ref++
                val heartbeat = buildJsonObject {
                    put("topic", "phoenix")
                    put("event", "heartbeat")
                    put("payload", buildJsonObject {})
                    put("ref", beatRef.toString())
                }
                webSocket?.send(heartbeat.toString())
            }
        }
    }

    fun disconnect() {
        heartbeatJob?.cancel()
        heartbeatJob = null
        webSocket?.close(1000, "Disconnect called")
        webSocket = null
    }
}
