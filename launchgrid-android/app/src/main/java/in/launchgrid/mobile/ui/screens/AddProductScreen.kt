package `in`.launchgrid.mobile.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import `in`.launchgrid.mobile.data.Graph
import `in`.launchgrid.mobile.ui.ErrorBanner
import `in`.launchgrid.mobile.ui.SectionLabel
import `in`.launchgrid.mobile.ui.theme.Brand
import kotlinx.coroutines.launch

/**
 * Native "quick add" — title + price + starting stock, posted to /api/products/add.
 * Photos stay on the web for now (needs the product-images storage bucket).
 */
@Composable
fun AddProductScreen(onAdded: () -> Unit) {
    val scope = rememberCoroutineScope()

    var title by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }
    var stock by remember { mutableStateOf("10") }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    val priceValue = price.trim().toDoubleOrNull()
    val canSave = title.isNotBlank() && priceValue != null && priceValue > 0 && !saving

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brand.Base)
            .verticalScroll(rememberScrollState())
            .imePadding()
            .padding(16.dp),
    ) {
        error?.let {
            ErrorBanner(it)
            Spacer(Modifier.height(12.dp))
        }

        SectionLabel("Product name")
        OutlinedTextField(
            value = title,
            onValueChange = { title = it },
            placeholder = { Text("e.g. Hand-Block Cotton Kurta Set") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )

        SectionLabel("Price (₹)")
        OutlinedTextField(
            value = price,
            onValueChange = { price = it.filter { c -> c.isDigit() || c == '.' } },
            placeholder = { Text("1499") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )

        SectionLabel("Starting stock")
        OutlinedTextField(
            value = stock,
            onValueChange = { stock = it.filter { c -> c.isDigit() } },
            placeholder = { Text("10") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
        )

        Spacer(Modifier.height(8.dp))
        Text(
            "You can add photos and a description later from the web dashboard.",
            fontSize = 12.sp,
            color = Brand.Secondary,
            lineHeight = 17.sp,
        )

        Spacer(Modifier.height(20.dp))
        Button(
            onClick = {
                val p = priceValue ?: return@Button
                saving = true
                error = null
                scope.launch {
                    Graph.repo.addProduct(title.trim(), p, costPrice = null)
                        .onSuccess { newId ->
                            val startStock = stock.trim().toIntOrNull()
                            if (startStock != null) {
                                Graph.repo.setProductStock(newId, startStock)
                            }
                            saving = false
                            onAdded()
                        }
                        .onFailure {
                            saving = false
                            error = it.message ?: "Couldn't add the product"
                        }
                }
            },
            enabled = canSave,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Brand.Ink),
        ) {
            Text(
                if (saving) "Adding…" else "Add product",
                fontSize = 15.sp,
                fontWeight = FontWeight.ExtraBold,
            )
        }
    }
}
