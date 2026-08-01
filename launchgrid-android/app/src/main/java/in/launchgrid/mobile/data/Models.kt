package `in`.launchgrid.mobile.data

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull

// ---- Supabase auth ----

@Serializable
data class AuthUser(val id: String = "", val email: String? = null)

@Serializable
data class AuthSession(
    val access_token: String,
    val refresh_token: String,
    val expires_in: Long = 3600,
    val expires_at: Long? = null,
    val user: AuthUser? = null,
)

// ---- LaunchGrid API ----

@Serializable
data class Plan(
    val tier: String = "",
    val public_name: String = "—",
    val status: String = "",
    val current_period_end: String? = null,
)

@Serializable
data class LimitsUsed(val products: Int = 0)

@Serializable
data class Entitlements(
    val tenant_id: String,
    val store_name: String = "",
    val subdomain: String = "",
    val plan: Plan = Plan(),
    val features: JsonObject = JsonObject(emptyMap()),
    val limits_used: LimitsUsed = LimitsUsed(),
) {
    val maxProducts: Long?
        get() = (features["max_products"] as? JsonPrimitive)?.longOrNull
}

// ---- Store data (PostgREST reads under RLS) ----

@Serializable
data class Order(
    val id: String,
    val total_amount: Double = 0.0,
    val payment_status: String = "",
    val fulfillment_status: String = "",
    val customer_name: String? = null,
    val customer_phone: String? = null,
    val created_at: String = "",
    val payment_method: String? = null,
)

@Serializable
data class ProductRef(val title: String = "", val image_urls: List<String>? = null)

@Serializable
data class OrderItem(
    val quantity: Int = 1,
    val price_at_purchase: Double = 0.0,
    val variant_title: String? = null,
    val products: ProductRef? = null,
)

@Serializable
data class OrderDetail(
    val id: String,
    val total_amount: Double = 0.0,
    val payment_status: String = "",
    val fulfillment_status: String = "",
    val customer_name: String? = null,
    val customer_phone: String? = null,
    val created_at: String = "",
    val payment_method: String? = null,
    val shipping_address: JsonElement? = null,
    val order_items: List<OrderItem> = emptyList(),
) {
    /** shipping_address may be plain text or a JSON object — render either. */
    val shippingAddressText: String?
        get() = when (val a = shipping_address) {
            null -> null
            is JsonPrimitive -> a.content.takeIf { it.isNotBlank() }
            else -> runCatching {
                a.jsonObject.values
                    .mapNotNull { (it as? JsonPrimitive)?.content?.takeIf { v -> v.isNotBlank() } }
                    .joinToString(", ")
            }.getOrNull()?.takeIf { it.isNotBlank() }
        }
}

@Serializable
data class Product(
    val id: String,
    val title: String = "",
    val retail_price: Double = 0.0,
    val stock: Int = 0,
    val image_urls: List<String>? = null,
    val is_active: Boolean = true,
)

data class TodayStats(val visitors: Int = 0, val orders: Int = 0, val revenue: Double = 0.0)

// ---- Research module ----

@Serializable
data class ProductIdea(
    val id: String,
    val research_project_id: String,
    val user_id: String,
    val name: String,
    val category: String? = null,
    val subcategory: String? = null,
    val target_retail_price: Double? = null,
    val max_preferred_moq: Int? = null,
    val max_initial_investment: Double? = null,
    val status: String = "researching",
    val tenant_id: String? = null,
    val product_id: String? = null,
    val promoted_at: String? = null,
    val created_at: String = "",
    val updated_at: String? = null,
    val has_compliance_evidence: Boolean = false,
    val data_source: String = "unknown"
)

@Serializable
data class ResearchReportRequest(
    val id: String,
    val user_id: String,
    val tenant_id: String,
    val requested_query: String,
    val normalized_query: String,
    val status: String = "queued",
    val product_idea_id: String? = null,
    val served_from_cache: Boolean = false,
    val attempts: Int = 0,
    val last_error: String? = null,
    val quality_report: JsonElement? = null,
    val promised_by: String = "",
    val created_at: String = "",
    val delivered_at: String? = null
)

@Serializable
data class ResearchPriceTier(
    val id: String,
    val quantity: Int,
    val unit_price: Double,
    val currency: String,
    val incoterm: String? = null
)

@Serializable
data class ResearchSupplierScore(
    val id: String,
    val manufacturer_confidence_score: Int,
    val manufacturer_confidence_label: String,
    val quality_score: Double? = null,
    val quality_label: String? = null
)

@Serializable
data class ResearchSupplier(
    val id: String,
    val supplier_name: String,
    val platform: String? = null,
    val country: String? = null,
    val city: String? = null,
    val currency: String? = null,
    val moq: Int? = null,
    val lead_time_days: Int? = null,
    val store_url: String? = null,
    val year_established: Int? = null,
    val audit_report_available: Boolean? = null,
    val business_licence_available: Boolean? = null,
    val export_history: Boolean? = null,
    val research_supplier_scores: List<ResearchSupplierScore>? = null,
    val research_price_tiers: List<ResearchPriceTier>? = null,
    val data_source: String = "unknown",
    val extraction_confidence: Double? = null,
    val source_url: String? = null
)

@Serializable
data class ResearchOpportunityScore(
    val id: String,
    val score: Double,
    val recommendation: String,
    val breakdown_json: JsonElement? = null
)

@Serializable
data class ResearchLandedCostScenario(
    val id: String,
    val outputs_json: JsonElement? = null
)

@Serializable
data class ResearchProfitabilityScenario(
    val id: String,
    val outputs_json: JsonElement? = null,
    val scenario_type: String
)

@Serializable
data class DecisionCockpit(
    val readinessMatrix: JsonElement? = null,
    val blockers: JsonElement? = null,
    val verdict: JsonElement? = null,
    val recommendedOrder: JsonElement? = null,
    val completeness: JsonElement? = null,
    val decisionConfidence: JsonElement? = null,
    val breakdown: JsonElement? = null
)

@Serializable
data class SourcingScenario(
    val route: String,
    val supplierName: String,
    val quantity: Int,
    val unitPriceForeign: Double,
    val currency: String,
    val packagingCost: Double,
    val freightCost: Double,
    val dutyAndImportCost: Double,
    val testingComplianceCost: Double,
    val readyToSellCostPerUnit: Double,
    val totalCashRequired: Double,
    val contributionPerUnit: Double,
    val contributionMarginPct: Double,
    val breakEvenUnits: Double,
    val inventoryExposureUnits: Int,
    val estimatedMonthsOfStock: Double? = null,
    val risk: String,
    val criticalMissingInputs: List<String> = emptyList(),
    val recommendedUse: String
)

@Serializable
data class SourcingScenariosWrapper(
    val scenarios: List<SourcingScenario> = emptyList(),
    val verdict: String = ""
)

@Serializable
data class ResearchReport(
    val idea: ProductIdea,
    val ideaDataSource: String = "unknown",
    val suppliers: List<ResearchSupplier> = emptyList(),
    val opportunityScore: ResearchOpportunityScore? = null,
    val landedCosts: List<ResearchLandedCostScenario> = emptyList(),
    val profitability: List<ResearchProfitabilityScenario> = emptyList(),
    val decisionCockpit: DecisionCockpit? = null,
    val sourcingScenarios: SourcingScenariosWrapper? = null
)
