import { createServiceClient } from '@/utils/supabase/service'

/**
 * Deducts stock for products and variants when an order is paid.
 */
export async function deductOrderStock(orderId: string) {
  const supabase = createServiceClient()

  try {
    // 1. Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('product_id, variant_id, quantity')
      .eq('order_id', orderId)

    if (itemsError || !items) {
      console.error('[INVENTORY_STOCK_DEDUCTION_ERROR] Failed to fetch order items:', itemsError)
      return
    }

    for (const item of items) {
      if (item.variant_id) {
        // Decrement variant stock
        const { error: variantError } = await supabase.rpc('decrement_variant_stock', {
          v_id: item.variant_id,
          qty: item.quantity
        })
        if (variantError) {
          // Fallback if RPC is not defined yet: run direct update
          console.warn('[INVENTORY_STOCK_DEDUCTION] RPC decrement_variant_stock failed, falling back to direct update:', variantError.message)
          const { data: currentVariant } = await supabase
            .from('product_variants')
            .select('stock')
            .eq('id', item.variant_id)
            .single()
          if (currentVariant) {
            const newStock = Math.max(0, (currentVariant.stock || 0) - item.quantity)
            await supabase
              .from('product_variants')
              .update({ stock: newStock })
              .eq('id', item.variant_id)
          }
        }
      } else {
        // Decrement product stock
        const { error: productError } = await supabase.rpc('decrement_product_stock', {
          p_id: item.product_id,
          qty: item.quantity
        })
        if (productError) {
          // Fallback if RPC is not defined yet: run direct update
          console.warn('[INVENTORY_STOCK_DEDUCTION] RPC decrement_product_stock failed, falling back to direct update:', productError.message)
          const { data: currentProduct } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single()
          if (currentProduct) {
            const newStock = Math.max(0, (currentProduct.stock || 0) - item.quantity)
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id)
          }
        }
      }
    }
    console.log(`[INVENTORY_STOCK_DEDUCTION] Successfully deducted stock for order ${orderId}`)
  } catch (err) {
    console.error('[INVENTORY_STOCK_DEDUCTION_ERROR] Unexpected error:', err)
  }
}
