import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useEntitlements, useTodayStats, useOrders } from '@/lib/queries'
import { useTenantRealtime } from '@/lib/realtime'
import { registerForPush } from '@/lib/notifications'
import { colors, radius, space } from '@/lib/theme'

export default function Dashboard() {
  const queryClient = useQueryClient()
  const { data: ent, isLoading } = useEntitlements()
  const { data: today } = useTodayStats(ent?.tenant_id)
  const { data: orders } = useOrders(ent?.tenant_id)
  const [pushAsked, setPushAsked] = useState(false)
  const [pushOn, setPushOn] = useState(false)

  useTenantRealtime(ent?.tenant_id)

  // Contextual permission pitch: register after the store context loads
  useEffect(() => {
    if (ent && !pushAsked) setPushAsked(true)
  }, [ent, pushAsked])

  const unfulfilled = (orders || []).filter(o => o.fulfillment_status === 'unfulfilled')

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['orders'] })
    queryClient.invalidateQueries({ queryKey: ['entitlements'] })
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
      >
        <View style={s.header}>
          <View>
            <Text style={s.storeName}>{ent?.store_name || (isLoading ? '…' : 'Your store')}</Text>
            {!!ent?.subdomain && <Text style={s.storeUrl}>{ent.subdomain}.launchgrid.in</Text>}
          </View>
          {!!ent?.plan && (
            <View style={s.planChip}><Text style={s.planChipText}>{ent.plan.public_name}</Text></View>
          )}
        </View>

        {/* Today strip — real numbers, realtime-invalidated */}
        <View style={s.statsRow}>
          <Stat label="Revenue today" value={`₹${(today?.revenue ?? 0).toLocaleString('en-IN')}`} />
          <Stat label="Orders" value={String(today?.orders ?? 0)} />
          <Stat label="Visitors" value={String(today?.visitors ?? 0)} />
        </View>

        {/* The actual to-do list: unfulfilled orders */}
        <Text style={s.sectionTitle}>
          {unfulfilled.length > 0 ? `Needs your attention (${unfulfilled.length})` : 'All caught up'}
        </Text>
        {unfulfilled.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyTitle}>No orders waiting on you.</Text>
            <Text style={s.emptySub}>Share your store link — your next order starts with a visitor.</Text>
          </View>
        ) : (
          unfulfilled.slice(0, 5).map(o => (
            <TouchableOpacity key={o.id} style={s.orderCard} onPress={() => router.push(`/order/${o.id}`)} activeOpacity={0.7}>
              <View style={s.orderLeft}>
                <Text style={s.orderCustomer}>{o.customer_name || 'Customer'}</Text>
                <Text style={s.orderMeta}>
                  #{o.id.slice(0, 8).toUpperCase()} · {o.payment_method === 'cod' ? 'COD' : (o.payment_status === 'paid' ? 'Paid' : 'Pending')}
                </Text>
              </View>
              <Text style={s.orderAmount}>₹{Number(o.total_amount).toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          ))
        )}

        {/* Push pitch — contextual, dismissible, "never miss an order" framing */}
        {pushAsked && !pushOn && (
          <TouchableOpacity
            style={s.pushCard}
            activeOpacity={0.85}
            onPress={async () => { const ok = await registerForPush(); setPushOn(ok) }}
          >
            <Text style={s.pushTitle}>🔔 Never miss an order</Text>
            <Text style={s.pushSub}>Get an instant alert the second someone buys — tap to enable.</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      {/* Cap accessibility scaling so ₹ figures never wrap the stat row */}
      <Text style={s.statValue} maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={s.statLabel} maxFontSizeMultiplier={1.3}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  scroll: { padding: space(4), paddingBottom: space(8) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space(4) },
  storeName: { fontSize: 22, fontWeight: '800', color: colors.ink },
  storeUrl: { fontSize: 12, color: colors.secondary, fontWeight: '600', marginTop: 2 },
  planChip: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  planChipText: { fontSize: 11, fontWeight: '800', color: colors.ink },
  statsRow: { flexDirection: 'row', gap: space(2), marginBottom: space(5) },
  stat: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space(3) },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.ink },
  statLabel: { fontSize: 10, fontWeight: '700', color: colors.subtle, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: space(2.5) },
  emptyCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space(5), alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 12, color: colors.secondary, marginTop: 4, textAlign: 'center' },
  orderCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: space(3.5), marginBottom: space(2), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  orderLeft: { flex: 1, paddingRight: space(2) },
  orderCustomer: { fontSize: 14, fontWeight: '700', color: colors.ink },
  orderMeta: { fontSize: 11, color: colors.secondary, fontWeight: '600', marginTop: 2 },
  orderAmount: { fontSize: 15, fontWeight: '800', color: colors.ink },
  pushCard: { backgroundColor: colors.ink, borderRadius: radius.md, padding: space(4), marginTop: space(5) },
  pushTitle: { color: '#fff', fontSize: 14, fontWeight: '800' },
  pushSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 3, lineHeight: 17 },
})
