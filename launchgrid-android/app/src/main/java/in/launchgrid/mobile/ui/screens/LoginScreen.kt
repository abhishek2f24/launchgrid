package `in`.launchgrid.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.launchgrid.mobile.AppViewModel
import `in`.launchgrid.mobile.ui.ErrorBanner
import `in`.launchgrid.mobile.ui.theme.Brand

@Composable
fun LoginScreen(vm: AppViewModel) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val uriHandler = LocalUriHandler.current

    fun signIn() {
        if (email.isBlank() || password.isBlank()) {
            error = "Enter your email and password."
            return
        }
        loading = true
        error = null
        vm.signIn(email.trim(), password) { message ->
            loading = false
            error = message
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brand.Base)
            .systemBarsPadding()
            .imePadding()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Spacer(Modifier.height(48.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(Brand.Accent)
            )
            Spacer(Modifier.size(8.dp))
            Text("LaunchGrid", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Ink)
        }
        Spacer(Modifier.height(24.dp))
        Text(
            "Your business,\nin your pocket.",
            fontSize = 32.sp,
            fontWeight = FontWeight.ExtraBold,
            lineHeight = 38.sp,
            color = Brand.Ink,
        )
        Spacer(Modifier.height(8.dp))
        Text("Sign in with your LaunchGrid account.", fontSize = 14.sp, color = Brand.Secondary)
        Spacer(Modifier.height(24.dp))

        error?.let {
            ErrorBanner(it)
            Spacer(Modifier.height(12.dp))
        }

        FieldLabel("Email")
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            placeholder = { Text("founder@example.com", color = Brand.Subtle) },
            colors = fieldColors(),
            shape = RoundedCornerShape(14.dp),
        )
        Spacer(Modifier.height(12.dp))
        FieldLabel("Password")
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            modifier = Modifier.fillMaxWidth(),
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            placeholder = { Text("••••••••", color = Brand.Subtle) },
            colors = fieldColors(),
            shape = RoundedCornerShape(14.dp),
        )

        Spacer(Modifier.height(24.dp))
        Button(
            onClick = { signIn() },
            enabled = !loading,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Brand.Ink,
                disabledContainerColor = Brand.Ink.copy(alpha = 0.7f),
            ),
        ) {
            if (loading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(20.dp),
                    color = Brand.Card,
                    strokeWidth = 2.dp,
                )
            } else {
                Text("Sign in", fontSize = 15.sp, fontWeight = FontWeight.ExtraBold)
            }
        }

        Spacer(Modifier.height(16.dp))
        Text(
            "Forgot password?",
            fontSize = 13.sp,
            fontWeight = FontWeight.SemiBold,
            color = Brand.Secondary,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .clickable { uriHandler.openUri("https://launchgrid.in/forgot-password") }
                .padding(8.dp),
        )

        Spacer(Modifier.height(24.dp))
        HorizontalDivider(color = Brand.Border)
        Spacer(Modifier.height(16.dp))
        Text(
            buildString {
                append("New to LaunchGrid? Create your store on launchgrid.in — ")
                append("it takes 15 minutes, then sign in here.")
            },
            fontSize = 13.sp,
            color = Brand.Secondary,
            lineHeight = 19.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .fillMaxWidth()
                .clickable { uriHandler.openUri("https://launchgrid.in/onboarding?utm_source=mobile_app") },
        )
        Spacer(Modifier.height(48.dp))
    }
}

@Composable
private fun FieldLabel(text: String) {
    Text(
        text.uppercase(),
        fontSize = 10.sp,
        fontWeight = FontWeight.ExtraBold,
        letterSpacing = 1.sp,
        color = Brand.Subtle,
        modifier = Modifier.padding(bottom = 6.dp),
    )
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedContainerColor = Brand.Card,
    unfocusedContainerColor = Brand.Card,
    focusedBorderColor = Brand.Ink,
    unfocusedBorderColor = Brand.Border,
    focusedTextColor = Brand.Ink,
    unfocusedTextColor = Brand.Ink,
)
