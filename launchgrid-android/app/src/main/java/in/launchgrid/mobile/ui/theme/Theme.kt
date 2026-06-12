package `in`.launchgrid.mobile.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// LaunchGrid design tokens — mirrors the web design system
object Brand {
    val Base = Color(0xFFFAF9F7)
    val Ink = Color(0xFF1A1A18)
    val Secondary = Color(0xFF6B6B67)
    val Subtle = Color(0xFF8A8A86)
    val Border = Color(0x14000000)
    val Card = Color(0xFFFFFFFF)
    val Accent = Color(0xFFFF8A00)
    val Green = Color(0xFF15803D)
    val GreenBg = Color(0xFFF0FDF4)
    val Red = Color(0xFFB91C1C)
    val RedBg = Color(0xFFFEF2F2)
    val AmberBg = Color(0xFFFFFBEB)
    val Blue = Color(0xFF2563EB)
}

private val LightColors = lightColorScheme(
    primary = Brand.Accent,
    onPrimary = Color.White,
    secondary = Brand.Ink,
    onSecondary = Color.White,
    background = Brand.Base,
    onBackground = Brand.Ink,
    surface = Brand.Card,
    onSurface = Brand.Ink,
    surfaceVariant = Brand.Base,
    onSurfaceVariant = Brand.Secondary,
    outline = Brand.Subtle,
    error = Brand.Red,
)

@Composable
fun LaunchGridTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColors,
        content = content,
    )
}
