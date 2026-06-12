package `in`.launchgrid.mobile.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
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
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.launchgrid.mobile.data.Graph
import `in`.launchgrid.mobile.ui.EmptyState
import `in`.launchgrid.mobile.ui.ErrorBanner
import `in`.launchgrid.mobile.ui.LgCard
import `in`.launchgrid.mobile.ui.Load
import `in`.launchgrid.mobile.ui.SectionLabel
import `in`.launchgrid.mobile.ui.formatInr
import `in`.launchgrid.mobile.ui.rememberLoad
import `in`.launchgrid.mobile.ui.shortId
import `in`.launchgrid.mobile.ui.theme.Brand
import kotlinx.coroutines.launch

// Forward-only status machine — mirrors the server's rules
private val NEXT_STATUS = mapOf(
    "unfulfilled" to ("fulfilled" to "Mark as packed"),
    "fulfilled" to ("shipped" to "Mark as shipped"),
    "shipped" to ("delivered" to "Mark as delivered"),
)

@Composable
fun OrderDetailScreen(orderId: String) {
    var refresh by remember { mutableIntStateOf(0) }
    val orderLoad by rememberLoad(orderId, refresh) { Graph.repo.orderDetail(orderId) }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var updating by remember { mutableStateOf(false) }
    var updateError by remember { mutableStateOf<String?>(null) }
    var confirmAction by remember { mutableStateOf<Pair<String, String>?>(null) }

    when (val load = orderLoad) {
        is Load.Loading -> EmptyState("Loading…")
        is Load.Error -> Column(Modifier.padding(16.dp)) { ErrorBanner(load.message) }
        is Load.Done -> {
            val order = load.value
            val action = NEXT_STATUS[order.fulfillment_status]
            val items = order.order_items

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Brand.Base)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
            ) {
                updateError?.let {
                    ErrorBanner(it)
                    Spacer(Modifier.height(12.dp))
                }

                LgCard {
                    Text(
                        shortId(order.id),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.ExtraBold,
                        letterSpacing = 1.sp,
                        color = Brand.Subtle,
                    )
                    Text(
                        formatInr(order.total_amount),
                        fontSize = 28.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Brand.Ink,
                        modifier = Modifier.padding(vertical = 4.dp),
                    )
                    Text(
                        buildString {
                            append(
                                if (order.payment_method == "cod") "Cash on Delivery"
                                else "Payment: ${order.payment_status}"
                            )
                            append(" · Status: ${order.fulfillment_status}")
                        },
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Brand.Secondary,
                    )
                }

                SectionLabel("Items")
                LgCard {
                    if (items.isEmpty()) {
                        Text("Item details unavailable", fontSize = 13.sp, color = Brand.Secondary)
                    }
                    items.forEachIndexed { i, it ->
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                buildString {
                                    append(it.products?.title ?: "Product")
                                    it.variant_title?.let { v -> append(" — $v") }
                                },
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Brand.Ink,
                                modifier = Modifier.weight(1f).padding(end = 8.dp),
                                maxLines = 1,
                            )
                            Text(
                                "×${it.quantity}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Brand.Secondary,
                                modifier = Modifier.padding(end = 12.dp),
                            )
                            Text(
                                formatInr(it.price_at_purchase),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Brand.Ink,
                            )
                        }
                        if (i < items.size - 1) HorizontalDivider(color = Brand.Border)
                    }
                }

                SectionLabel("Customer")
                LgCard {
                    Text(
                        order.customer_name ?: "Customer",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = Brand.Ink,
                    )
                    order.customer_phone?.let {
                        Spacer(Modifier.height(2.dp))
                        Text(it, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Brand.Secondary)
                    }
                    order.shippingAddressText?.let {
                        Spacer(Modifier.height(6.dp))
                        Text(it, fontSize = 12.sp, color = Brand.Secondary, lineHeight = 18.sp)
                    }
                }

                Spacer(Modifier.height(8.dp))

                if (action != null) {
                    Button(
                        onClick = { confirmAction = action },
                        enabled = !updating,
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Brand.Ink),
                    ) {
                        Text(
                            if (updating) "Updating…" else action.second,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                        )
                    }
                    Spacer(Modifier.height(8.dp))
                }

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(Brand.Card)
                        .border(1.dp, Brand.Border, RoundedCornerShape(14.dp))
                        .clickable {
                            val message = buildString {
                                append("Hi ${order.customer_name ?: ""}! Your order ")
                                append(shortId(order.id))
                                append(" (${formatInr(order.total_amount)}) is ${order.fulfillment_status}. ")
                                append("Thank you for shopping with us!")
                            }
                            val send = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, message)
                            }
                            context.startActivity(Intent.createChooser(send, "Share order update"))
                        }
                        .padding(16.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("Share update on WhatsApp", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Brand.Ink)
                }

                // Post-completion education tease (no purchase link — store compliant)
                if (order.fulfillment_status == "delivered") {
                    Spacer(Modifier.height(16.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Brand.GreenBg)
                            .padding(16.dp),
                    ) {
                        Text("Order complete 🎉", fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Green)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "On the Scale Revenue plan, the GST invoice for this order would have been " +
                                "generated automatically. See your plan options on the web dashboard.",
                            fontSize = 12.sp,
                            color = Brand.Green,
                            lineHeight = 17.sp,
                        )
                    }
                }
                Spacer(Modifier.height(32.dp))
            }

            confirmAction?.let { (next, label) ->
                AlertDialog(
                    onDismissRequest = { confirmAction = null },
                    title = { Text(label) },
                    text = { Text("Update this order's status?") },
                    confirmButton = {
                        TextButton(onClick = {
                            confirmAction = null
                            updating = true
                            updateError = null
                            scope.launch {
                                Graph.repo.updateOrderStatus(order.id, next)
                                    .onSuccess { refresh++ }
                                    .onFailure { updateError = it.message }
                                updating = false
                            }
                        }) { Text("Confirm") }
                    },
                    dismissButton = {
                        TextButton(onClick = { confirmAction = null }) { Text("Cancel") }
                    },
                )
            }
        }
    }
}
