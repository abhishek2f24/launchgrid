package `in`.launchgrid.mobile.ui.screens

import android.Manifest
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.launchgrid.mobile.AppViewModel
import `in`.launchgrid.mobile.push.Push
import `in`.launchgrid.mobile.ui.ErrorBanner
import `in`.launchgrid.mobile.ui.LgCard
import `in`.launchgrid.mobile.ui.SectionLabel
import `in`.launchgrid.mobile.ui.formatDateLong
import `in`.launchgrid.mobile.ui.theme.Brand

@Composable
fun SettingsScreen(vm: AppViewModel) {
    val ent by vm.entitlements.collectAsState()
    val uriHandler = LocalUriHandler.current

    var showDelete by remember { mutableStateOf(false) }
    var confirmText by remember { mutableStateOf("") }
    var deleting by remember { mutableStateOf(false) }
    var deleteError by remember { mutableStateOf<String?>(null) }
    var notifStatus by remember { mutableStateOf<String?>(null) }

    val notifPermission = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) Push.register()
        notifStatus = if (granted) "Order alerts are on." else "Allow notifications in system settings."
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brand.Base)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text("Settings", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Ink)
        vm.email?.let {
            Spacer(Modifier.height(2.dp))
            Text(it, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Brand.Secondary)
        }

        // Plan — read-only on mobile (no in-app purchases; billing happens on the web)
        SectionLabel("Your plan")
        LgCard {
            Text(
                ent?.plan?.public_name ?: "—",
                fontSize = 17.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Brand.Ink,
            )
            Spacer(Modifier.height(3.dp))
            Text(
                buildString {
                    append("Status: ${ent?.plan?.status ?: "—"}")
                    ent?.plan?.current_period_end?.let { append(" · renews ${formatDateLong(it)}") }
                },
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = Brand.Secondary,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Manage your subscription from the LaunchGrid web dashboard.",
                fontSize = 11.sp,
                color = Brand.Subtle,
                lineHeight = 16.sp,
            )
        }

        SectionLabel("Notifications")
        LgCard {
            Column(
                Modifier
                    .fillMaxWidth()
                    .clickable {
                        if (Build.VERSION.SDK_INT >= 33) {
                            notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
                        } else {
                            Push.register()
                            notifStatus = "Order alerts are on."
                        }
                    }
            ) {
                Text("Enable order alerts", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Brand.Ink)
                Spacer(Modifier.height(2.dp))
                Text(
                    notifStatus ?: "Instant notification when someone places an order",
                    fontSize = 11.sp,
                    color = Brand.Secondary,
                    lineHeight = 16.sp,
                )
            }
        }

        SectionLabel("Legal")
        LgCard {
            SettingsRow("Privacy Policy") { uriHandler.openUri("https://launchgrid.in/legal/privacy") }
            HorizontalDivider(color = Brand.Border, modifier = Modifier.padding(vertical = 10.dp))
            SettingsRow("Terms of Service") { uriHandler.openUri("https://launchgrid.in/legal/terms") }
            HorizontalDivider(color = Brand.Border, modifier = Modifier.padding(vertical = 10.dp))
            SettingsRow("Support") { uriHandler.openUri("https://launchgrid.in/support") }
        }

        SectionLabel("Account")
        LgCard {
            SettingsRow("Sign out") { vm.signOut() }
            HorizontalDivider(color = Brand.Border, modifier = Modifier.padding(vertical = 10.dp))

            // Play account-deletion policy: in-app deletion is required
            if (!showDelete) {
                Column(Modifier.fillMaxWidth().clickable { showDelete = true }) {
                    Text("Delete account", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Brand.Red)
                    Spacer(Modifier.height(2.dp))
                    Text(
                        "Permanently removes your store and all data",
                        fontSize = 11.sp,
                        color = Brand.Secondary,
                    )
                }
            } else {
                Text(
                    "This permanently deletes your store, products, and order history.",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Brand.Red,
                    lineHeight = 20.sp,
                )
                deleteError?.let {
                    Spacer(Modifier.height(8.dp))
                    ErrorBanner(it)
                }
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = confirmText,
                    onValueChange = { confirmText = it.uppercase() },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Type DELETE to confirm", color = Brand.Subtle) },
                    shape = RoundedCornerShape(10.dp),
                )
                Spacer(Modifier.height(12.dp))
                Button(
                    onClick = {
                        if (confirmText != "DELETE") {
                            deleteError = "Type DELETE to confirm — this protects you from accidental deletion."
                            return@Button
                        }
                        deleting = true
                        deleteError = null
                        vm.deleteAccount { message ->
                            deleting = false
                            deleteError = message
                        }
                    },
                    enabled = !deleting,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Brand.Red),
                ) {
                    Text(
                        if (deleting) "Deleting…" else "Permanently delete my account",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    "Cancel",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Brand.Secondary,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            showDelete = false
                            confirmText = ""
                            deleteError = null
                        }
                        .padding(8.dp),
                )
            }
        }

        Spacer(Modifier.height(24.dp))
        Text(
            "LaunchGrid v1.0.0",
            fontSize = 11.sp,
            color = Brand.Subtle,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun SettingsRow(label: String, onClick: () -> Unit) {
    Text(
        label,
        fontSize = 14.sp,
        fontWeight = FontWeight.Bold,
        color = Brand.Ink,
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
    )
}
