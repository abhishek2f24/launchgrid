package `in`.launchgrid.mobile.push

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import `in`.launchgrid.mobile.MainActivity
import `in`.launchgrid.mobile.R

class PushService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        Push.registerToken(token)
    }

    /**
     * Foreground messages don't auto-display — show them on the orders channel.
     * (Background notification-messages are displayed by the system automatically.)
     */
    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title ?: message.data["title"] ?: "LaunchGrid"
        val body = message.notification?.body ?: message.data["body"] ?: return

        val manager = NotificationManagerCompat.from(this)
        if (!manager.areNotificationsEnabled()) return

        val openApp = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val notification = NotificationCompat.Builder(this, Push.CHANNEL_ORDERS)
            .setSmallIcon(R.drawable.ic_notification)
            .setColor(0xFFFF8A00.toInt())
            .setContentTitle(title)
            .setContentText(body)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(openApp)
            .build()

        try {
            manager.notify(System.currentTimeMillis().toInt(), notification)
        } catch (_: SecurityException) {
            // POST_NOTIFICATIONS revoked between the check and notify — nothing to do.
        }
    }
}
