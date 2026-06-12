package `in`.launchgrid.mobile.data

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Tokens live in Keystore-backed encrypted storage — never plain SharedPreferences.
 * Mirrors the architecture rule from the previous app: secure at rest, app-scoped.
 */
class SessionStore(context: Context) {

    private val prefs: SharedPreferences = run {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "lg_session",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    }

    val accessToken: String? get() = prefs.getString(KEY_ACCESS, null)
    val refreshToken: String? get() = prefs.getString(KEY_REFRESH, null)
    val expiresAt: Long get() = prefs.getLong(KEY_EXPIRES_AT, 0L)
    val email: String? get() = prefs.getString(KEY_EMAIL, null)
    val hasSession: Boolean get() = refreshToken != null

    fun save(session: AuthSession) {
        val expiresAt = session.expires_at
            ?: (System.currentTimeMillis() / 1000 + session.expires_in)
        prefs.edit {
            putString(KEY_ACCESS, session.access_token)
            putString(KEY_REFRESH, session.refresh_token)
            putLong(KEY_EXPIRES_AT, expiresAt)
            session.user?.email?.let { putString(KEY_EMAIL, it) }
        }
    }

    fun clear() = prefs.edit { clear() }

    private companion object {
        const val KEY_ACCESS = "access_token"
        const val KEY_REFRESH = "refresh_token"
        const val KEY_EXPIRES_AT = "expires_at"
        const val KEY_EMAIL = "email"
    }
}
