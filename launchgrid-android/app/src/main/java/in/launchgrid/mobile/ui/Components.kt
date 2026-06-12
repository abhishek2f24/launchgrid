package `in`.launchgrid.mobile.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.produceState
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.launchgrid.mobile.ui.theme.Brand
import java.text.NumberFormat
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

// ---- Async load state ----

sealed interface Load<out T> {
    data object Loading : Load<Nothing>
    data class Done<T>(val value: T) : Load<T>
    data class Error(val message: String) : Load<Nothing>
}

/** Loads data whenever [keys] change; bump a refresh counter key to reload. */
@Composable
fun <T> rememberLoad(vararg keys: Any?, loader: suspend () -> Result<T>): State<Load<T>> =
    produceState<Load<T>>(initialValue = Load.Loading, keys = keys) {
        if (value !is Load.Done) value = Load.Loading
        loader()
            .onSuccess { value = Load.Done(it) }
            .onFailure { value = Load.Error(it.message ?: "Something went wrong") }
    }

// ---- Formatting ----

private val inLocale: Locale = Locale.forLanguageTag("en-IN")

fun formatInr(amount: Double): String {
    val nf = NumberFormat.getNumberInstance(inLocale)
    nf.maximumFractionDigits = if (amount % 1.0 == 0.0) 0 else 2
    return "₹" + nf.format(amount)
}

fun shortId(id: String): String = "#" + id.take(8).uppercase()

private val dayMonth = DateTimeFormatter.ofPattern("d MMM", Locale.ENGLISH)

fun formatDateShort(iso: String): String =
    runCatching { OffsetDateTime.parse(iso).format(dayMonth) }.getOrDefault("")

fun formatDateLong(iso: String): String = runCatching {
    OffsetDateTime.parse(iso).format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH))
}.getOrDefault(iso)

// ---- Building blocks ----

@Composable
fun LgCard(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(Brand.Card)
            .border(1.dp, Brand.Border, RoundedCornerShape(14.dp))
            .padding(16.dp),
        content = content,
    )
}

@Composable
fun SectionLabel(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text.uppercase(),
        fontSize = 11.sp,
        fontWeight = FontWeight.ExtraBold,
        letterSpacing = 1.sp,
        color = Brand.Subtle,
        modifier = modifier.padding(top = 12.dp, bottom = 8.dp),
    )
}

@Composable
fun StatusBadge(status: String) {
    val color = when (status) {
        "unfulfilled" -> Brand.Accent
        "fulfilled", "delivered" -> Brand.Green
        "shipped" -> Brand.Blue
        else -> Brand.Secondary
    }
    Text(
        text = status.ifBlank { "pending" }.replaceFirstChar { it.uppercase() },
        fontSize = 10.sp,
        fontWeight = FontWeight.ExtraBold,
        color = color,
        modifier = Modifier
            .clip(RoundedCornerShape(999.dp))
            .background(color.copy(alpha = 0.13f))
            .padding(horizontal = 8.dp, vertical = 3.dp),
    )
}

@Composable
fun EmptyState(title: String, subtitle: String? = null) {
    Column(modifier = Modifier.fillMaxWidth().padding(top = 64.dp, start = 24.dp, end = 24.dp)) {
        Text(
            title,
            fontSize = 15.sp,
            fontWeight = FontWeight.Bold,
            color = Brand.Ink,
            modifier = Modifier.fillMaxWidth(),
        )
        if (subtitle != null) {
            Spacer(Modifier.height(8.dp))
            Text(subtitle, fontSize = 13.sp, color = Brand.Secondary, lineHeight = 19.sp)
        }
    }
}

@Composable
fun ErrorBanner(message: String) {
    Text(
        text = message,
        color = Brand.Red,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .background(Brand.RedBg)
            .padding(12.dp),
    )
}
