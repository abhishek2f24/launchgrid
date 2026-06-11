import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import * as StoreReview from 'expo-store-review'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useOrder, useUpdateOrderStatus } from '@/lib/queries'
import { colors, radius, space } from '@/lib/theme'

/** Ask for a store rating at peak satisfaction (a delivered order), max once per version. */
async function maybeAskForReview() {
  try {
    const KEY = 'lg_reviewed_v1'
    if (await AsyncStorage.getItem(KEY)) return
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview()
      await AsyncStorage.setItem(KEY, '1')
    }
  } catch { /* never block the flow */ }
}

// Forward-only status machine — mirrors the server's rules
const NEXT_STATUS: Record<string, { next: string; label: string } | undefined> = {
  unfulfilled: { next: 'fulfilled', label: 'Mark as packed' },
  fulfilled: { next: 'shipped', label: 'Mark as shipped' },
  shipped: { next: 'delivered', label: 'Mark as delivered' },
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { data: order, isLoading } = useOrder(id)
  const updateStatus = useUpdateOrderStatus()

  if (isLoading || !order) {
    return <View style={s.center}><Text style={s.muted}>{isLoading ? 'Loading…' : 'Order not found'}</Text></View>
  }

  const action = NEXT_STATUS[order.fulfillment_status]
  const items = order.order_items || []

  const advance = () => {
    if (!action) return
    Alert.alert(action.label, 'Update this order\'s status?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () =>
          updateStatus.mutate(
            { orderId: order.id, fulfillmentStatus: action.next },
            {
              onError: (e: Error) => Alert.alert('Could not update', e.message),
              onSuccess: () => { if (action.next === 'delivered') maybeAskForReview() },
            }
          ),
      },
    ])
  }

  const shareUpdate = () => {
    Share.share({
      message: `Hi ${order.customer_name || ''}! Your order #${order.id.slice(0, 8).toUpperCase()} (₹${Number(order.total_amount).toLocaleString('en-IN')}) is ${order.fulfillment_status}. Thank you for shopping with us!`,
    })
  }

  return (
    <ScrollView style={s.safe} contentContainerStyle={s.scroll}>
      <View style={s.card}>
        <Text style={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={s.amount}>₹{Number(order.total_amount).toLocaleString('en-IN')}</Text>
        <Text style={s.meta}>
          {order.payment_method === 'cod' ? 'Cash on Delivery' : `Payment: ${order.payment_status}`} · Status: {order.fulfillment_status}
        </Text>
      </View>

      <Text style={s.section}>Items</Text>
      <View style={s.card}>
        {items.map((it: any, i: number) => (
          <View key={i} style={[s.itemRow, i < items.length - 1 && s.itemDivider]}>
            <Text style={s.itemTitle} numberOfLines={1}>
              {it.products?.title || 'Product'}{it.variant_title ? ` — ${it.variant_title}` : ''}
            </Text>
            <Text style={s.itemQty}>×{it.quantity}</Text>
            <Text style={s.itemPrice}>₹{Number(it.price_at_purchase).toLocaleString('en-IN')}</Text>
          </View>
        ))}
        {items.length === 0 && <Text style={s.muted}>Item details unavailable</Text>}
      </View>

      <Text style={s.section}>Customer</Text>
      <View style={s.card}>
        <Text style={s.customer}>{order.customer_name}</Text>
        {!!order.customer_phone && <Text style={s.meta}>{order.customer_phone}</Text>}
        {!!order.shipping_address && <Text style={[s.meta, { marginTop: 6, lineHeight: 18 }]}>{order.shipping_address}</Text>}
      </View>

      {action && (
        <TouchableOpacity style={s.primaryBtn} onPress={advance} disabled={updateStatus.isPending} activeOpacity={0.85}>
          <Text style={s.primaryBtnText}>{updateStatus.isPending ? 'Updating…' : action.label}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={s.secondaryBtn} onPress={shareUpdate} activeOpacity={0.85}>
        <Text style={s.secondaryBtnText}>Share update on WhatsApp</Text>
      </TouchableOpacity>

      {/* Post-completion education tease (no purchase link — store compliant) */}
      {order.fulfillment_status === 'delivered' && (
        <View style={s.teaseCard}>
          <Text style={s.teaseTitle}>Order complete 🎉</Text>
          <Text style={s.teaseSub}>
            On the Scale Revenue plan, the GST invoice for this order would have been generated automatically. See your plan options on the web dashboard.
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  scroll: { padding: space(4), paddingBottom: space(10) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.base },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space(4), marginBottom: space(3) },
  orderId: { fontSize: 12, fontWeight: '800', color: colors.subtle, letterSpacing: 1 },
  amount: { fontSize: 28, fontWeight: '800', color: colors.ink, marginVertical: 4 },
  meta: { fontSize: 12, color: colors.secondary, fontWeight: '600' },
  section: { fontSize: 13, fontWeight: '800', color: colors.ink, marginBottom: space(2), marginTop: space(1) },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space(2) },
  itemDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemTitle: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.ink, paddingRight: space(2) },
  itemQty: { fontSize: 12, color: colors.secondary, fontWeight: '700', marginRight: space(3) },
  itemPrice: { fontSize: 13, fontWeight: '800', color: colors.ink },
  customer: { fontSize: 15, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  muted: { fontSize: 13, color: colors.secondary },
  primaryBtn: { backgroundColor: colors.ink, borderRadius: radius.md, padding: space(4), alignItems: 'center', marginTop: space(2) },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.md, padding: space(4), alignItems: 'center', marginTop: space(2) },
  secondaryBtnText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  teaseCard: { backgroundColor: colors.greenBg, borderWidth: 1, borderColor: 'rgba(21,128,61,0.2)', borderRadius: radius.md, padding: space(4), marginTop: space(4) },
  teaseTitle: { fontSize: 14, fontWeight: '800', color: colors.green },
  teaseSub: { fontSize: 12, color: '#166534', marginTop: 4, lineHeight: 17 },
})
