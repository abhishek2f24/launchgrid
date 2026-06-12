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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.launchgrid.mobile.AppViewModel
import `in`.launchgrid.mobile.data.Graph
import `in`.launchgrid.mobile.data.Order
import `in`.launchgrid.mobile.data.TodayStats
import `in`.launchgrid.mobile.ui.LgCard
import `in`.launchgrid.mobile.ui.Load
import `in`.launchgrid.mobile.ui.formatInr
import `in`.launchgrid.mobile.ui.rememberLoad
import `in`.launchgrid.mobile.ui.shortId
import `in`.launchgrid.mobile.ui.theme.Brand

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(vm: AppViewModel, onOrderClick: (String) -> Unit) {
    val ent by vm.entitlements.collectAsState()
    val tenantId = ent?.tenant_id
    var refresh by remember { mutableIntStateOf(0) }
    var refreshing by remember { mutableStateOf(false) }

    val stats by rememberLoad(tenantId, refresh) {
        val id = tenantId ?: return@rememberLoad Result.success(TodayStats())
        Graph.repo.todayStats(id)
    }
    val orders by rememberLoad(tenantId, refresh) {
        val id = tenantId ?: return@rememberLoad Result.success(emptyList<Order>())
        Graph.repo.orders(id)
    }

    PullToRefreshBox(
        isRefreshing = refreshing,
        onRefresh = {
            refreshing = true
            vm.loadEntitlements()
            refresh++
            refreshing = false
        },
        modifier = Modifier.fillMaxSize().background(Brand.Base),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            // Header: store identity + plan chip
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column {
                    Text(
                        ent?.store_name?.ifBlank { null } ?: "Your store",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Brand.Ink,
                    )
                    ent?.subdomain?.takeIf { it.isNotBlank() }?.let {
                        Text(
                            "$it.launchgrid.in",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Brand.Secondary,
                        )
                    }
                }
                ent?.plan?.public_name?.takeIf { it.isNotBlank() && it != "—" }?.let {
                    Text(
                        it,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Brand.Ink,
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(Brand.AmberBg)
                            .padding(horizontal = 10.dp, vertical = 5.dp),
                    )
                }
            }

            Spacer(Modifier.height(16.dp))

            // Today strip
            val s = (stats as? Load.Done)?.value ?: TodayStats()
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatCard("Revenue today", formatInr(s.revenue), Modifier.weight(1f))
                StatCard("Orders", s.orders.toString(), Modifier.weight(1f))
                StatCard("Visitors", s.visitors.toString(), Modifier.weight(1f))
            }

            Spacer(Modifier.height(20.dp))

            // The actual to-do list: unfulfilled orders
            val unfulfilled = ((orders as? Load.Done)?.value ?: emptyList())
                .filter { it.fulfillment_status == "unfulfilled" }

            Text(
                if (unfulfilled.isNotEmpty()) "Needs your attention (${unfulfilled.size})" else "All caught up",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Brand.Ink,
            )
            Spacer(Modifier.height(10.dp))

            when {
                orders is Load.Error -> LgCard {
                    Text((orders as Load.Error).message, fontSize = 13.sp, color = Brand.Red)
                }
                unfulfilled.isEmpty() -> LgCard {
                    Text(
                        "No orders waiting on you.",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Brand.Ink,
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "Share your store link — your next order starts with a visitor.",
                        fontSize = 13.sp,
                        color = Brand.Secondary,
                        lineHeight = 18.sp,
                    )
                }
                else -> unfulfilled.take(5).forEach { o ->
                    OrderRow(o, onClick = { onOrderClick(o.id) })
                    Spacer(Modifier.height(8.dp))
                }
            }
            Spacer(Modifier.height(32.dp))
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .background(Brand.Card)
            .padding(14.dp),
    ) {
        Text(value, fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Ink)
        Spacer(Modifier.height(2.dp))
        Text(label, fontSize = 12.sp, color = Brand.Subtle)
    }
}

@Composable
private fun OrderRow(o: Order, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brand.Card)
            .clickable(onClick = onClick)
            .padding(14.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(
                o.customer_name ?: "Customer",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Brand.Ink,
            )
            Text(
                buildString {
                    append(shortId(o.id))
                    append(" · ")
                    append(
                        if (o.payment_method == "cod") "COD"
                        else if (o.payment_status == "paid") "Paid" else "Pending"
                    )
                },
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Brand.Secondary,
            )
        }
        Text(formatInr(o.total_amount), fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Ink)
    }
}
