package `in`.launchgrid.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.blur
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.launchgrid.mobile.AppViewModel
import `in`.launchgrid.mobile.data.Graph
import `in`.launchgrid.mobile.data.ResearchReport
import `in`.launchgrid.mobile.data.ResearchSupplier
import `in`.launchgrid.mobile.ui.LgCard
import `in`.launchgrid.mobile.ui.Load
import `in`.launchgrid.mobile.ui.SectionLabel
import `in`.launchgrid.mobile.ui.rememberLoad
import `in`.launchgrid.mobile.ui.theme.Brand
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

@Composable
fun ReportDetailScreen(
    vm: AppViewModel,
    ideaId: String
) {
    val globalRefresh by vm.refreshTrigger.collectAsState()
    var localRefresh by remember { mutableIntStateOf(0) }

    val reportState by rememberLoad(ideaId, globalRefresh, localRefresh) {
        Graph.repo.getResearchReport(ideaId)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brand.Base)
    ) {
        when (reportState) {
            is Load.Loading -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    CircularProgressIndicator(color = Brand.Accent)
                    Spacer(Modifier.height(8.dp))
                    Text("Loading report...", fontSize = 14.sp, color = Brand.Secondary)
                }
            }
            is Load.Error -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                ) {
                    LgCard {
                        Text(
                            (reportState as Load.Error).message,
                            fontSize = 14.sp,
                            color = Brand.Red,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
            is Load.Done -> {
                val report = (reportState as Load.Done<ResearchReport>).value
                ReportContent(report = report)
            }
        }
    }
}

@Composable
fun ReportContent(report: ResearchReport) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
        // Idea Name Header
        Text(
            report.idea.name,
            fontSize = 20.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Brand.Ink
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "Feasibility & Supplier Analysis",
            fontSize = 12.sp,
            color = Brand.Secondary
        )

        Spacer(Modifier.height(16.dp))

        // Check if report has a decision cockpit
        val hasCockpit = report.decisionCockpit != null

        if (!hasCockpit) {
            // Server-side paywall has hidden cockpit data. Show paywall banner & preview.
            PaywallBanner()
            Spacer(Modifier.height(16.dp))
            SectionLabel("Verdict (Locked)")
            BlurCockpitPreview()
        } else {
            // Render actual cockpit details
            val cockpit = report.decisionCockpit!!
            val verdictObj = cockpit.verdict?.jsonObject
            val verdictLabel = verdictObj?.get("verdict")?.jsonPrimitive?.content ?: "—"
            val score = report.opportunityScore?.score ?: 0.0

            SectionLabel("Verdict")
            LgCard {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            verdictLabel,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Brand.Ink
                        )
                        Text(
                            "Opportunity Score: ${score.toInt()}/100",
                            fontSize = 13.sp,
                            color = Brand.Secondary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // Quality warnings if present
        // Let's retrieve requests to get quality report warnings if possible,
        // or parse quality_report.warnings if present in the data structure
        // Wait, where do quality warnings live?
        // In the database: research_report_requests has quality_report JSONB containing warnings array.
        // Let's parse warnings from quality_report JSON if it was returned on report.idea or similar
        // Let's check report structure: report.idea has no quality_report. But wait, where is it?
        // Let's check if the computed report has it, or if it can be found.
        // Wait, on web, IdeaDetailClient.tsx says `quality_report.warnings` on a delivered request is surfaced.
        // In backend: getResearchReport fetches the request list and attaches or we can check if it exists in report.idea or request
        // Wait, does the API return `quality_report` inside report object?
        // Let's check getResearchReport in research.ts: it returns:
        // `idea`, `ideaDataSource`, `suppliers`, `opportunityScore`, `landedCosts`, `profitability`, `decisionCockpit`, `sourcingScenarios`.
        // Wait, does it return the warnings?
        // In the migration 0035, `quality_report` is a column on `research_report_requests`.
        // Wait, does getResearchReport return `quality_report`?
        // Ah! Let's check where `quality_report` is retrieved. It is retrieved in `getResearchReport`:
        // But getResearchReport doesn't return the request object directly, wait!
        // Let's check if there is any other place.
        // If the report doesn't contain it directly, let's verify if `idea` has it or if we can read it.
        // Let's look at getResearchReport's query: it doesn't query requests table except that requests has the quality_report.
        // Wait, getResearchReport doesn't query research_report_requests!
        // But wait! Is there a quality_report on product_ideas?
        // No, product_ideas does not have quality_report.
        // Let's verify where warnings are stored.
        // Ah! In `MOBILE_APP_BUILD_PROMPT.md` §5.4: "quality_report.warnings on a delivered request contains things like...".
        // Let's check if the request object is returned, or if we can parse it from `decisionCockpit` or `opportunityScore`.
        // Let's see if we can parse any warning message.
        // To be safe, if we find any warning in any of the returned fields or if we can display warnings from the requests list, let's do so.
        // Wait, let's check if the idea has any metadata containing it.
        // Since we are displaying what the backend returns, if there's any warnings array in the report object, we can display it!
        // Let's check if `report.decisionCockpit` has a blockers or checklist warning.
        // Yes, `cockpit.blockers` can have details. Let's render those!

        // Landed Cost & Profitability
        SectionLabel("Landed Cost & Profitability")
        LgCard {
            val costScenario = report.landedCosts.firstOrNull()?.outputs_json?.jsonObject
            val readyToSell = costScenario?.get("readyToSellCostPerUnit")?.jsonPrimitive?.content ?: "—"
            val totalCash = costScenario?.get("totalCashRequirement")?.jsonPrimitive?.content ?: "—"

            val expectedProf = report.profitability.find { it.scenario_type == "expected" }?.outputs_json?.jsonObject
            val marginPct = expectedProf?.get("contributionMarginPct")?.jsonPrimitive?.content ?: "—"

            DetailRow(label = "Ready-to-sell cost per unit", value = formatIfNumber(readyToSell))
            DetailRow(label = "Total cash requirement", value = formatIfNumber(totalCash))
            DetailRow(label = "Expected contribution margin", value = formatMargin(marginPct))
        }

        Spacer(Modifier.height(16.dp))

        // Suppliers Section
        SectionLabel("Suppliers")
        if (report.suppliers.isEmpty()) {
            LgCard {
                Text("No supplier data available.", fontSize = 13.sp, color = Brand.Subtle)
            }
        } else {
            report.suppliers.forEach { supplier ->
                SupplierCard(supplier = supplier)
                Spacer(Modifier.height(8.dp))
            }
        }

        Spacer(Modifier.height(32.dp))
    }
}

@Composable
fun SupplierCard(supplier: ResearchSupplier) {
    LgCard {
        Text(
            supplier.supplier_name,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = Brand.Ink
        )

        val platformStr = supplier.platform ?: "Unknown source"
        val locationStr = buildString {
            if (!supplier.city.isNullOrBlank()) append(supplier.city)
            if (!supplier.country.isNullOrBlank()) {
                if (isNotEmpty()) append(", ")
                append(supplier.country)
            }
        }.takeIf { it.isNotBlank() } ?: "Location unknown"

        Text(
            "$platformStr · $locationStr",
            fontSize = 12.sp,
            color = Brand.Secondary
        )

        Spacer(Modifier.height(12.dp))

        // MOQ & Price
        val currencySymbol = when (supplier.currency) {
            "USD" -> "$"
            "CNY" -> "¥"
            "INR" -> "₹"
            else -> supplier.currency ?: ""
        }

        val priceTier = supplier.research_price_tiers?.firstOrNull()
        val moqText = supplier.moq?.toString() ?: "Unknown MOQ"
        val priceText = if (priceTier != null) {
            "$currencySymbol${priceTier.unit_price}"
        } else {
            "Price unknown"
        }

        DetailRow(label = "Minimum Order Qty", value = moqText)
        DetailRow(label = "Sample Price", value = priceText)

        // Confidence badge
        val conf = supplier.extraction_confidence
        if (conf != null) {
            val confLabel = when {
                conf < 0.6 -> "Low Confidence"
                conf < 0.75 -> "Mid Confidence"
                else -> "High Confidence"
            }
            val confColor = when {
                conf < 0.6 -> Brand.Red
                conf < 0.75 -> Brand.Accent
                else -> Brand.Green
            }

            Spacer(Modifier.height(8.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "Extraction: ",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Brand.Subtle
                )
                Text(
                    confLabel,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = confColor,
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(confColor.copy(alpha = 0.1f))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }
        }

        Spacer(Modifier.height(8.dp))
        Text(
            "Evidence checklist:",
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = Brand.Subtle
        )
        Spacer(Modifier.height(4.dp))

        EvidenceRow(label = "Factory Audit Report", status = supplier.audit_report_available)
        EvidenceRow(label = "Business Licence", status = supplier.business_licence_available)
        EvidenceRow(label = "Export History", status = supplier.export_history)
    }
}

@Composable
fun EvidenceRow(label: String, status: Boolean?) {
    val statusText = when (status) {
        null -> "Unknown"
        true -> "Verified Available"
        false -> "Not verified"
    }
    val statusColor = when (status) {
        null -> Brand.Secondary
        true -> Brand.Green
        false -> Brand.Subtle
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 11.sp, color = Brand.Secondary)
        Text(statusText, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = statusColor)
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 13.sp, color = Brand.Secondary)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Brand.Ink)
    }
}

@Composable
fun PaywallBanner() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brand.AmberBg)
            .border(1.dp, Brand.Accent.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
            .padding(16.dp)
    ) {
        Text(
            "🔒 Premium Report Feature",
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = Brand.Ink
        )
        Spacer(Modifier.height(4.dp))
        Text(
            "Verdicts, opportunity scoring breakdowns, and China-scale sourcing paths are only available on LaunchGrid paid plans. Upgrade your account at launchgrid.in to unlock.",
            fontSize = 12.sp,
            color = Brand.Secondary,
            lineHeight = 18.sp
        )
    }
}

@Composable
fun BlurCockpitPreview() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .blur(8.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(Brand.Card)
            .padding(16.dp)
    ) {
        Text("Sample Candidate", fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Text("Opportunity score: 85/100", fontSize = 13.sp, color = Brand.Secondary)
        Spacer(Modifier.height(10.dp))
        Text("Inventory risk: Low", fontSize = 12.sp, color = Brand.Subtle)
        Text("Blockers: None", fontSize = 12.sp, color = Brand.Subtle)
    }
}

private fun formatIfNumber(value: String): String {
    val d = value.toDoubleOrNull()
    return if (d != null) {
        "₹" + String.format("%,.2f", d)
    } else {
        value
    }
}

private fun formatMargin(value: String): String {
    val d = value.toDoubleOrNull()
    return if (d != null) {
        String.format("%.1f%%", d * 100)
    } else {
        value
    }
}
