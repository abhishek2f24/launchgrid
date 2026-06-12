package `in`.launchgrid.mobile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import `in`.launchgrid.mobile.data.Entitlements
import `in`.launchgrid.mobile.data.Graph
import `in`.launchgrid.mobile.push.Push
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface AuthState {
    data object SignedOut : AuthState
    data object SignedIn : AuthState
}

class AppViewModel : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(
        if (Graph.store.hasSession) AuthState.SignedIn else AuthState.SignedOut
    )
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private val _entitlements = MutableStateFlow<Entitlements?>(null)
    val entitlements: StateFlow<Entitlements?> = _entitlements.asStateFlow()

    private val _entitlementsError = MutableStateFlow<String?>(null)
    val entitlementsError: StateFlow<String?> = _entitlementsError.asStateFlow()

    val email: String? get() = Graph.store.email

    init {
        if (Graph.store.hasSession) loadEntitlements()
    }

    fun loadEntitlements() {
        viewModelScope.launch {
            Graph.repo.entitlements()
                .onSuccess {
                    _entitlements.value = it
                    _entitlementsError.value = null
                }
                .onFailure {
                    _entitlementsError.value = it.message
                    // The repo clears the session when the refresh token is dead.
                    if (!Graph.store.hasSession) _authState.value = AuthState.SignedOut
                }
        }
    }

    fun signIn(email: String, password: String, onResult: (String?) -> Unit) {
        viewModelScope.launch {
            Graph.auth.signIn(email, password)
                .onSuccess {
                    _authState.value = AuthState.SignedIn
                    loadEntitlements()
                    Push.register()
                    onResult(null)
                }
                .onFailure { onResult(it.message ?: "Sign-in failed") }
        }
    }

    fun signOut() {
        // Best-effort device unregistration first — sign-out must never be blocked by it.
        Push.unregister {
            Graph.auth.signOut()
            _entitlements.value = null
            _authState.value = AuthState.SignedOut
        }
    }

    fun deleteAccount(onError: (String) -> Unit) {
        viewModelScope.launch {
            Graph.repo.deleteAccount()
                .onSuccess { signOut() }
                .onFailure { onError(it.message ?: "Could not delete account") }
        }
    }
}
