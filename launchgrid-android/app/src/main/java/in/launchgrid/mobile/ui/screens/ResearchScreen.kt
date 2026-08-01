package `in`.launchgrid.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.launchgrid.mobile.AppViewModel
import `in`.launchgrid.mobile.data.Graph
import `in`.launchgrid.mobile.data.ProductIdea
import `in`.launchgrid.mobile.data.ResearchReportRequest
import `in`.launchgrid.mobile.ui.LgCard
import `in`.launchgrid.mobile.ui.Load
import `in`.launchgrid.mobile.ui.SectionLabel
import `in`.launchgrid.mobile.ui.rememberLoad
import `in`.launchgrid.mobile.ui.theme.Brand
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ResearchScreen(
    vm: AppViewModel,
    onReportClick: (String) -> Unit,
    onRequestClick: () -> Unit
) {
    val ent by vm.entitlements.collectAsState()
    val tenantId = ent?.tenant_id
    val globalRefresh by vm.refreshTrigger.collectAsState()
    var localRefresh by remember { mutableIntStateOf(0) }

    val creditBalance by rememberLoad(tenantId, globalRefresh, localRefresh) {
        val tid = tenantId ?: return@rememberLoad Result.success(0)
        Graph.repo.researchCreditBalance(tid)
    }

    val requests by rememberLoad(tenantId, globalRefresh, localRefresh) {
        val tid = tenantId ?: return@rememberLoad Result.success(emptyList())
        Graph.repo.researchReportRequests(tid)
    }

    val ideas by rememberLoad(tenantId, globalRefresh, localRefresh) {
        val tid = tenantId ?: return@rememberLoad Result.success(emptyList())
        Graph.repo.myIdeas()
    }

    PullToRefreshBox(
        isRefreshing = false,
        onRefresh = {
            vm.loadEntitlements()
            localRefresh++
        },
        modifier = Modifier.fillMaxSize().background(Brand.Base),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            // Header with Credit Balance
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        "Product Research",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Brand.Ink
                    )
                    Text(
                        "Analyze ideas with supplier evidence",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Brand.Secondary
                    )
                }

                // Balance display
                Column(
                    horizontalAlignment = Alignment.End,
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(Brand.Card)
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                ) {
                    val bal = (creditBalance as? Load.Done)?.value ?: 0
                    Text(
                        "$bal",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Brand.Ink
                    )
                    Text(
                        "Credits",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Brand.Subtle
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Action Button
            Button(
                onClick = onRequestClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = Brand.Accent,
                    contentColor = Brand.Card
                ),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    "Request Research Report (1 credit)",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(vertical = 4.dp)
                )
            }

            Spacer(Modifier.height(16.dp))

            // Active / History Requests Section
            val reqList = (requests as? Load.Done)?.value ?: emptyList()
            if (reqList.isNotEmpty()) {
                SectionLabel("Research Requests")
                reqList.forEach { req ->
                    RequestRow(req = req, onIdeaClick = onReportClick)
                    Spacer(Modifier.height(8.dp))
                }
                Spacer(Modifier.height(16.dp))
            }

            // Research Reports / Ideas Section
            SectionLabel("Research Reports")
            when (ideas) {
                is Load.Loading -> {
                    Text("Loading reports...", fontSize = 13.sp, color = Brand.Subtle)
                }
                is Load.Error -> {
                    LgCard {
                        Text("Error loading reports", fontSize = 13.sp, color = Brand.Red)
                    }
                }
                is Load.Done -> {
                    val ideaList = (ideas as Load.Done<List<ProductIdea>>).value
                    if (ideaList.isEmpty()) {
                        LgCard {
                            Text(
                                "No reports generated yet.",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = Brand.Ink
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                "Request research above to start scanning supplier options for your next product idea.",
                                fontSize = 12.sp,
                                color = Brand.Secondary,
                                lineHeight = 18.sp
                            )
                        }
                    } else {
                        ideaList.forEach { idea ->
                            IdeaRow(idea = idea, onClick = { onReportClick(idea.id) })
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }
            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
fun RequestRow(req: ResearchReportRequest, onIdeaClick: (String) -> Unit) {
    val statusBg = when (req.status) {
        "queued" -> Brand.AmberBg
        "running" -> Brand.Base
        "delivered" -> Brand.GreenBg
        "failed" -> Brand.RedBg
        "refunded" -> Brand.RedBg
        else -> Brand.Base
    }

    val statusColor = when (req.status) {
        "queued" -> Brand.Accent
        "running" -> Brand.Secondary
        "delivered" -> Brand.Green
        "failed" -> Brand.Red
        "refunded" -> Brand.Red
        else -> Brand.Ink
    }

    val statusText = when (req.status) {
        "queued" -> {
            val formattedTime = runCatching {
                val odt = OffsetDateTime.parse(req.promised_by)
                odt.format(DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH))
            }.getOrDefault("soon")
            "Queued · Ready by $formattedTime"
        }
        "running" -> "Researching"
        "delivered" -> "Ready"
        "failed" -> "Failed"
        "refunded" -> "Credit returned"
        else -> req.status.replaceFirstChar { it.uppercase() }
    }

    val clickableModifier = if (req.status == "delivered" && req.product_idea_id != null) {
        Modifier.clickable { onIdeaClick(req.product_idea_id) }
    } else {
        Modifier
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brand.Card)
            .then(clickableModifier)
            .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                req.requested_query,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Brand.Ink
            )
            Spacer(Modifier.height(4.dp))
            Text(
                statusText,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = statusColor
            )
            if (req.status == "refunded" && !req.last_error.isNullOrBlank()) {
                Spacer(Modifier.height(2.dp))
                Text(
                    req.last_error,
                    fontSize = 11.sp,
                    color = Brand.Secondary,
                    lineHeight = 15.sp
                )
            }
        }
        if (req.status == "delivered" && req.product_idea_id != null) {
            Text(
                "Open →",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = Brand.Accent
            )
        }
    }
}

@Composable
fun IdeaRow(idea: ProductIdea, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brand.Card)
            .clickable(onClick = onClick)
            .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                idea.name,
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Brand.Ink
            )
            Spacer(Modifier.height(4.dp))
            Text(
                idea.status.replace('_', ' ').replaceFirstChar { it.uppercase() },
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = if (idea.status == "launch_ready" || idea.status == "promoted") Brand.Green else Brand.Secondary
            )
        }
        Text(
            "View report →",
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            color = Brand.Accent
        )
    }
}
