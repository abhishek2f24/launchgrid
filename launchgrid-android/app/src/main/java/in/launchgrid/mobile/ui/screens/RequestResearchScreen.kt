package `in`.launchgrid.mobile.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.launchgrid.mobile.AppViewModel
import `in`.launchgrid.mobile.data.Graph
import `in`.launchgrid.mobile.ui.LgCard
import `in`.launchgrid.mobile.ui.Load
import `in`.launchgrid.mobile.ui.rememberLoad
import `in`.launchgrid.mobile.ui.theme.Brand
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestResearchScreen(
    vm: AppViewModel,
    onBack: () -> Unit
) {
    val ent by vm.entitlements.collectAsState()
    val tenantId = ent?.tenant_id
    val globalRefresh by vm.refreshTrigger.collectAsState()
    val scope = rememberCoroutineScope()

    val creditBalance by rememberLoad(tenantId, globalRefresh) {
        val tid = tenantId ?: return@rememberLoad Result.success(0)
        Graph.repo.researchCreditBalance(tid)
    }

    var query by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var submitting by remember { mutableStateOf(false) }

    val bal = (creditBalance as? Load.Done)?.value ?: 0
    val isOutOfCredits = (creditBalance is Load.Done) && bal <= 0

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brand.Base)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        Text(
            "What product do you want to source?",
            fontSize = 18.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Brand.Ink
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "Enter a descriptive name (e.g. \"10000mAh Slim Power Bank\"). LaunchGrid will scan supplier listings and generate a feasibility report.",
            fontSize = 12.sp,
            color = Brand.Secondary,
            lineHeight = 18.sp
        )

        Spacer(Modifier.height(20.dp))

        if (isOutOfCredits) {
            LgCard {
                Text(
                    "You're out of research credits.",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Brand.Red
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    "Add more from your account on launchgrid.in.",
                    fontSize = 12.sp,
                    color = Brand.Secondary,
                    lineHeight = 18.sp
                )
            }
            Spacer(Modifier.height(20.dp))
        }

        OutlinedTextField(
            value = query,
            onValueChange = {
                query = it
                error = null
            },
            label = { Text("Product Query") },
            placeholder = { Text("e.g. Bamboo travel cutlery set") },
            singleLine = true,
            enabled = !isOutOfCredits && !submitting,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Brand.Accent,
                focusedLabelColor = Brand.Accent,
                cursorColor = Brand.Accent
            ),
            modifier = Modifier.fillMaxWidth()
        )

        error?.let {
            Spacer(Modifier.height(8.dp))
            Text(
                it,
                color = Brand.Red,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(Modifier.height(24.dp))

        Button(
            onClick = {
                val qTrim = query.trim()
                if (qTrim.length < 3) {
                    error = "Query must be at least 3 characters"
                    return@Button
                }
                submitting = true
                scope.launch {
                    Graph.repo.requestResearchReport(qTrim)
                        .onSuccess {
                            vm.triggerRefresh()
                            onBack()
                        }
                        .onFailure {
                            error = it.message ?: "Request failed"
                            submitting = false
                        }
                }
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = Brand.Accent,
                contentColor = Brand.Card
            ),
            shape = RoundedCornerShape(12.dp),
            enabled = !isOutOfCredits && !submitting && query.isNotBlank(),
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                if (submitting) "Requesting..." else "Submit Request",
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                modifier = Modifier.padding(vertical = 4.dp)
            )
        }
    }
}
