import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useEntitlements, useOrders, type Order } from '@/lib/queries'
import { colors, radius, space } from '@/lib/theme'

const STATUS_COLORS: Record<string, string> = {
  unfulfilled: colors.accent,
  fulfilled: colors.green,
  shipped: '#2563EB',
  delivered: colors.green,
}

export default function OrdersScreen() {
  const { data: ent } = useEntitlements()
  const { data: orders, isLoading, refetch, isRefetching } = useOrders(ent?.tenant_id)

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Text style={s.title}>Orders</Text>
      <FlatList
        data={orders || []}
        keyExtractor={(o: Order) => o.id}
        contentContainerStyle={s.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>{isLoading ? 'Loading…' : 'Your first order will appear here.'}</Text>
            {!isLoading && <Text style={s.emptySub}>Share your store link to get your first visitors — orders follow.</Text>}
          </View>
        }
        renderItem={({ item: o }: { item: Order }) => (
          <TouchableOpacity style={s.card} onPress={() => router.push(`/order/${o.id}`)} activeOpacity={0.7}>
            <View style={s.row}>
              <Text style={s.customer}>{o.customer_name || 'Customer'}</Text>
              <Text style={s.amount}>₹{Number(o.total_amount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.meta}>
                #{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                {o.payment_method === 'cod' ? ' · COD' : ''}
              </Text>
              <View style={[s.badge, { backgroundColor: (STATUS_COLORS[o.fulfillment_status] || colors.subtle) + '22' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLORS[o.fulfillment_status] || colors.secondary }]}>
                  {o.fulfillment_status || 'pending'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, paddingHorizontal: space(4), paddingTop: space(2), paddingBottom: space(3) },
  list: { paddingHorizontal: space(4), paddingBottom: space(8) },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space(3.5), marginBottom: space(2) },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  customer: { fontSize: 14, fontWeight: '700', color: colors.ink },
  amount: { fontSize: 15, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 11, color: colors.secondary, fontWeight: '600' },
  badge: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingTop: space(16), paddingHorizontal: space(6) },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.secondary, textAlign: 'center', marginTop: space(2), lineHeight: 19 },
})
