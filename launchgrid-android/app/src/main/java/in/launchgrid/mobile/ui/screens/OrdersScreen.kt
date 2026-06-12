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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
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
import `in`.launchgrid.mobile.data.Order
import `in`.launchgrid.mobile.ui.EmptyState
import `in`.launchgrid.mobile.ui.ErrorBanner
import `in`.launchgrid.mobile.ui.Load
import `in`.launchgrid.mobile.ui.StatusBadge
import `in`.launchgrid.mobile.ui.formatDateShort
import `in`.launchgrid.mobile.ui.formatInr
import `in`.launchgrid.mobile.ui.rememberLoad
import `in`.launchgrid.mobile.ui.shortId
import `in`.launchgrid.mobile.ui.theme.Brand

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrdersScreen(vm: AppViewModel, onOrderClick: (String) -> Unit) {
    val ent by vm.entitlements.collectAsState()
    val tenantId = ent?.tenant_id
    var refresh by remember { mutableIntStateOf(0) }
    var refreshing by remember { mutableStateOf(false) }

    val orders by rememberLoad(tenantId, refresh) {
        val id = tenantId ?: return@rememberLoad Result.success(emptyList<Order>())
        Graph.repo.orders(id)
    }

    PullToRefreshBox(
        isRefreshing = refreshing,
        onRefresh = { refreshing = true; refresh++; refreshing = false },
        modifier = Modifier.fillMaxSize().background(Brand.Base),
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        ) {
            item {
                Text("Orders", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Ink)
                Spacer(Modifier.height(12.dp))
            }
            when (val o = orders) {
                is Load.Loading -> item { EmptyState("Loading…") }
                is Load.Error -> item { ErrorBanner(o.message) }
                is Load.Done -> {
                    if (o.value.isEmpty()) {
                        item {
                            EmptyState(
                                "Your first order will appear here.",
                                "Share your store link to get your first visitors — orders follow.",
                            )
                        }
                    } else {
                        items(o.value, key = { it.id }) { order ->
                            OrderCard(order, onClick = { onOrderClick(order.id) })
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OrderCard(o: Order, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brand.Card)
            .clickable(onClick = onClick)
            .padding(14.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                o.customer_name ?: "Customer",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Brand.Ink,
            )
            Text(formatInr(o.total_amount), fontSize = 15.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Ink)
        }
        Spacer(Modifier.height(6.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                buildString {
                    append(shortId(o.id))
                    val d = formatDateShort(o.created_at)
                    if (d.isNotEmpty()) append(" · $d")
                    if (o.payment_method == "cod") append(" · COD")
                },
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = Brand.Secondary,
            )
            StatusBadge(o.fulfillment_status)
        }
    }
}
