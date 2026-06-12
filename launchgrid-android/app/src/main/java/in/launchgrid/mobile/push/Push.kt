package `in`.launchgrid.mobile.push

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import com.google.firebase.messaging.FirebaseMessaging
import `in`.launchgrid.mobile.data.Graph
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * FCM token lifecycle. Registration is fire-and-forget: alerts are a convenience,
 * never something that blocks sign-in/out.
 */
object Push {

    const val CHANNEL_ORDERS = "orders"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    fun ensureChannel(context: Context) {
        val manager = context.getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            CHANNEL_ORDERS,
            "Order alerts",
            NotificationManager.IMPORTANCE_HIGH,
        ).apply {
            description = "Instant notification when someone places an order"
        }
        manager.createNotificationChannel(channel)
    }

    /** Register this device's current FCM token with the backend (if signed in). */
    fun register() {
        if (!Graph.store.hasSession) return
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            scope.launch { Graph.repo.registerDevice(token, deviceName()) }
        }
    }

    /** Called from FirebaseMessagingService when FCM rotates the token. */
    fun registerToken(token: String) {
        if (!Graph.store.hasSession) return
        scope.launch { Graph.repo.registerDevice(token, deviceName()) }
    }

    /** Unregister before the session is cleared; [then] runs regardless of outcome. */
    fun unregister(then: () -> Unit) {
        if (!Graph.store.hasSession) {
            then()
            return
        }
        FirebaseMessaging.getInstance().token
            .addOnSuccessListener { token ->
                scope.launch {
                    Graph.repo.unregisterDevice(token)
                    then()
                }
            }
            .addOnFailureListener { then() }
    }

    private fun deviceName(): String =
        "${Build.MANUFACTURER} ${Build.MODEL}".trim().take(80)
}
