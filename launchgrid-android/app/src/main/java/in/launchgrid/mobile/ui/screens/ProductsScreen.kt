package `in`.launchgrid.mobile.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import `in`.launchgrid.mobile.AppViewModel
import `in`.launchgrid.mobile.data.Graph
import `in`.launchgrid.mobile.data.Product
import `in`.launchgrid.mobile.ui.EmptyState
import `in`.launchgrid.mobile.ui.ErrorBanner
import `in`.launchgrid.mobile.ui.Load
import `in`.launchgrid.mobile.ui.formatInr
import `in`.launchgrid.mobile.ui.rememberLoad
import `in`.launchgrid.mobile.ui.theme.Brand

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductsScreen(vm: AppViewModel, refreshSignal: Int = 0, onAddClick: () -> Unit) {
    val ent by vm.entitlements.collectAsState()
    val tenantId = ent?.tenant_id
    var refresh by remember { mutableIntStateOf(0) }
    var refreshing by remember { mutableStateOf(false) }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // A product was just added on the add screen → refresh list + plan usage count.
    LaunchedEffect(refreshSignal) {
        if (refreshSignal > 0) {
            vm.loadEntitlements()
            refresh++
        }
    }

    // Local optimistic overrides for stock edits (id -> stock). A successful
    // PATCH means the server already matches; on failure we drop the override
    // so the card falls back to the loaded value.
    val stockOverrides = remember { mutableStateMapOf<String, Int>() }
    var stockError by remember { mutableStateOf<String?>(null) }

    val products by rememberLoad(tenantId, refresh) {
        val id = tenantId ?: return@rememberLoad Result.success(emptyList<Product>())
        Graph.repo.products(id)
    }

    fun adjustStock(p: Product, delta: Int) {
        val current = stockOverrides[p.id] ?: p.stock
        val next = (current + delta).coerceAtLeast(0)
        if (next == current) return
        stockOverrides[p.id] = next // optimistic
        stockError = null
        scope.launch {
            Graph.repo.setProductStock(p.id, next).onFailure {
                stockOverrides[p.id] = current // revert
                stockError = it.message ?: "Couldn't update stock"
            }
        }
    }

    fun shareProduct(p: Product) {
        val subdomain = ent?.subdomain?.takeIf { it.isNotBlank() } ?: return
        val message = "${p.title} — ${formatInr(p.retail_price)}\n" +
            "Order here: https://$subdomain.launchgrid.in/product/${p.id}"
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, message)
        }
        context.startActivity(Intent.createChooser(send, "Share product"))
    }

    PullToRefreshBox(
        isRefreshing = refreshing,
        onRefresh = { refreshing = true; refresh++; refreshing = false },
        modifier = Modifier.fillMaxSize().background(Brand.Base),
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
        ) {
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Products", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Ink)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ent?.let {
                            Text(
                                "${it.limits_used.products}/${it.maxProducts ?: "∞"}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Brand.Secondary,
                            )
                            Spacer(Modifier.width(12.dp))
                        }
                        Text(
                            "＋ Add",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Brand.Card,
                            modifier = Modifier
                                .clip(RoundedCornerShape(10.dp))
                                .background(Brand.Ink)
                                // Native quick-add (title/price/stock). Photos still on web for now.
                                .clickable(onClick = onAddClick)
                                .padding(horizontal = 14.dp, vertical = 8.dp),
                        )
                    }
                }
                Spacer(Modifier.height(12.dp))

                // Catalog-cap meter — appears at 80%+, sells the upgrade at the moment of need
                val max = ent?.maxProducts ?: 0L
                val used = ent?.limits_used?.products ?: 0
                if (max > 0 && used.toFloat() / max >= 0.8f) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(Brand.AmberBg)
                            .padding(14.dp),
                    ) {
                        Text(
                            "Your catalog is ${(used * 100 / max)}% full",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Brand.Ink,
                        )
                        Spacer(Modifier.height(3.dp))
                        Text(
                            "Higher plans remove the cap — manage your plan from the web dashboard.",
                            fontSize = 12.sp,
                            color = Brand.Secondary,
                            lineHeight = 16.sp,
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                }
            }

            stockError?.let { msg ->
                item {
                    ErrorBanner(msg)
                    Spacer(Modifier.height(8.dp))
                }
            }

            when (val p = products) {
                is Load.Loading -> item { EmptyState("Loading…") }
                is Load.Error -> item { ErrorBanner(p.message) }
                is Load.Done -> {
                    if (p.value.isEmpty()) {
                        item {
                            EmptyState(
                                "No products yet.",
                                "Add products on the web dashboard — paste any Meesho/Amazon link " +
                                    "and it imports automatically.",
                            )
                        }
                    } else {
                        items(p.value, key = { it.id }) { product ->
                            ProductCard(
                                p = product,
                                stock = stockOverrides[product.id] ?: product.stock,
                                onShare = { shareProduct(product) },
                                onIncrement = { adjustStock(product, +1) },
                                onDecrement = { adjustStock(product, -1) },
                            )
                            Spacer(Modifier.height(8.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ProductCard(
    p: Product,
    stock: Int,
    onShare: () -> Unit,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brand.Card)
            .padding(12.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            val image = p.image_urls?.firstOrNull()
            if (image != null) {
                AsyncImage(
                    model = image,
                    contentDescription = p.title,
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Brand.Base),
                )
            } else {
                Box(
                    modifier = Modifier
                        .size(52.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(Brand.Base),
                    contentAlignment = Alignment.Center,
                ) {
                    Text("📦", fontSize = 18.sp)
                }
            }
            Column(Modifier.weight(1f)) {
                Text(
                    p.title,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = Brand.Ink,
                    lineHeight = 18.sp,
                    maxLines = 2,
                )
                Spacer(Modifier.height(3.dp))
                Text(
                    buildString {
                        append(formatInr(p.retail_price))
                        if (!p.is_active) append(" · Hidden")
                    },
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Brand.Secondary,
                )
            }
            Text(
                "Share",
                fontSize = 12.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Brand.Ink,
                modifier = Modifier
                    .clip(RoundedCornerShape(10.dp))
                    .background(Brand.Base)
                    .clickable(onClick = onShare)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
            )
        }

        Spacer(Modifier.height(10.dp))

        // Inline stock control — merchants adjust inventory without the website
        Row(verticalAlignment = Alignment.CenterVertically) {
            StepButton("−", enabled = stock > 0, onClick = onDecrement)
            Box(
                modifier = Modifier.widthIn(min = 46.dp).padding(horizontal = 6.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text("$stock", fontSize = 16.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Ink)
            }
            StepButton("+", enabled = true, onClick = onIncrement)
            Spacer(Modifier.width(10.dp))
            Text(
                if (stock > 0) "in stock" else "Out of stock",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (stock > 0) Brand.Secondary else Brand.Red,
            )
        }
    }
}

@Composable
private fun StepButton(symbol: String, enabled: Boolean, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .size(34.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(Brand.Base)
            .alpha(if (enabled) 1f else 0.4f)
            .then(if (enabled) Modifier.clickable(onClick = onClick) else Modifier),
        contentAlignment = Alignment.Center,
    ) {
        Text(symbol, fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Brand.Ink)
    }
}
