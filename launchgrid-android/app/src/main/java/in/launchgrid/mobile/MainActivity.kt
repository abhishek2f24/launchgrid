package `in`.launchgrid.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Inventory2
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import `in`.launchgrid.mobile.ui.screens.AddProductScreen
import `in`.launchgrid.mobile.ui.screens.HomeScreen
import `in`.launchgrid.mobile.ui.screens.LoginScreen
import `in`.launchgrid.mobile.ui.screens.OrderDetailScreen
import `in`.launchgrid.mobile.ui.screens.OrdersScreen
import `in`.launchgrid.mobile.ui.screens.ProductsScreen
import `in`.launchgrid.mobile.ui.screens.SettingsScreen
import `in`.launchgrid.mobile.ui.theme.Brand
import `in`.launchgrid.mobile.ui.theme.LaunchGridTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            LaunchGridTheme {
                val vm: AppViewModel = viewModel()
                val authState by vm.authState.collectAsState()
                when (authState) {
                    AuthState.SignedOut -> LoginScreen(vm)
                    AuthState.SignedIn -> MainScaffold(vm)
                }
            }
        }
    }
}

private data class Tab(
    val route: String,
    val label: String,
    val icon: ImageVector,
    val iconOutline: ImageVector,
)

private val tabs = listOf(
    Tab("home", "Home", Icons.Filled.Home, Icons.Outlined.Home),
    Tab("orders", "Orders", Icons.Filled.Receipt, Icons.Outlined.Receipt),
    Tab("products", "Products", Icons.Filled.Inventory2, Icons.Outlined.Inventory2),
    Tab("settings", "Settings", Icons.Filled.Settings, Icons.Outlined.Settings),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainScaffold(vm: AppViewModel) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val isOrderDetail = currentRoute?.startsWith("order/") == true
    val isAddProduct = currentRoute == "products/add"
    val showBackBar = isOrderDetail || isAddProduct

    Scaffold(
        containerColor = Brand.Base,
        topBar = {
            if (showBackBar) {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            if (isAddProduct) "Add product" else "Order",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                        containerColor = Brand.Base,
                        titleContentColor = Brand.Ink,
                        navigationIconContentColor = Brand.Ink,
                    ),
                )
            }
        },
        bottomBar = {
            if (!showBackBar) {
                NavigationBar(containerColor = Brand.Card) {
                    tabs.forEach { tab ->
                        val selected = currentRoute == tab.route
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(
                                    imageVector = if (selected) tab.icon else tab.iconOutline,
                                    contentDescription = tab.label,
                                )
                            },
                            label = {
                                Text(tab.label, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = Brand.Ink,
                                selectedTextColor = Brand.Ink,
                                unselectedIconColor = Brand.Subtle,
                                unselectedTextColor = Brand.Subtle,
                                indicatorColor = Brand.AmberBg,
                            ),
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(innerPadding),
        ) {
            composable("home") {
                HomeScreen(vm, onOrderClick = { navController.navigate("order/$it") })
            }
            composable("orders") {
                OrdersScreen(vm, onOrderClick = { navController.navigate("order/$it") })
            }
            composable("products") { entry ->
                val added by entry.savedStateHandle
                    .getStateFlow("product_added", 0)
                    .collectAsState()
                ProductsScreen(
                    vm,
                    refreshSignal = added,
                    onAddClick = { navController.navigate("products/add") },
                )
            }
            composable("settings") { SettingsScreen(vm) }
            composable("order/{id}") { entry ->
                val id = entry.arguments?.getString("id").orEmpty()
                OrderDetailScreen(orderId = id)
            }
            composable("products/add") {
                AddProductScreen(onAdded = {
                    val prev = navController.previousBackStackEntry
                    prev?.savedStateHandle?.set(
                        "product_added",
                        (prev.savedStateHandle.get<Int>("product_added") ?: 0) + 1,
                    )
                    navController.popBackStack()
                })
            }
        }
    }
}
