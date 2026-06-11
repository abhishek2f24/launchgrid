import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useEntitlements, useProducts, type Product } from '@/lib/queries'
import { colors, radius, space } from '@/lib/theme'

export default function ProductsScreen() {
  const { data: ent } = useEntitlements()
  const { data: products, isLoading, refetch, isRefetching } = useProducts(ent?.tenant_id)

  const shareProduct = (p: { id: string; title: string; retail_price: number }) => {
    if (!ent?.subdomain) return
    Share.share({
      message: `${p.title} — ₹${Number(p.retail_price).toLocaleString('en-IN')}\nOrder here: https://${ent.subdomain}.launchgrid.in/product/${p.id}`,
    })
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.headerRow}>
        <Text style={s.title}>Products</Text>
        <View style={s.headerRight}>
          {!!ent && (
            <Text style={s.count}>
              {ent.limits_used.products}/{String(ent.features.max_products)}
            </Text>
          )}
          <TouchableOpacity style={s.addBtn} onPress={() => router.push('/product/new')} activeOpacity={0.85}>
            <Text style={s.addBtnText}>＋ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Catalog-cap meter — appears at 80%+, sells the upgrade at the moment of need */}
      {!!ent && Number(ent.features.max_products) > 0 &&
        ent.limits_used.products / Number(ent.features.max_products) >= 0.8 && (
        <View style={s.capCard}>
          <Text style={s.capTitle}>
            Your catalog is {Math.round((ent.limits_used.products / Number(ent.features.max_products)) * 100)}% full
          </Text>
          <Text style={s.capSub}>Higher plans remove the cap — manage your plan from the web dashboard.</Text>
        </View>
      )}
      <FlatList
        data={products || []}
        keyExtractor={(p: Product) => p.id}
        contentContainerStyle={s.list}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyTitle}>{isLoading ? 'Loading…' : 'No products yet.'}</Text>
            {!isLoading && (
              <Text style={s.emptySub}>
                Add products on the web dashboard — paste any Meesho/Amazon link and it imports automatically. Camera-based creation is coming to the app next.
              </Text>
            )}
          </View>
        }
        renderItem={({ item: p }: { item: Product }) => (
          <View style={s.card}>
            {p.image_urls?.[0]
              ? <Image source={{ uri: p.image_urls[0] }} style={s.img} />
              : <View style={[s.img, s.imgPh]}><Text style={{ fontSize: 18 }}>📦</Text></View>}
            <View style={s.info}>
              <Text style={s.pTitle} numberOfLines={2}>{p.title}</Text>
              <Text style={s.pMeta}>
                ₹{Number(p.retail_price).toLocaleString('en-IN')} · {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                {!p.is_active && ' · Hidden'}
              </Text>
            </View>
            <TouchableOpacity style={s.shareBtn} onPress={() => shareProduct(p)} activeOpacity={0.7}>
              <Text style={s.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space(4), paddingTop: space(2), paddingBottom: space(3) },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
  count: { fontSize: 12, fontWeight: '800', color: colors.secondary },
  addBtn: { backgroundColor: colors.ink, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  capCard: { marginHorizontal: space(4), marginBottom: space(3), backgroundColor: colors.amberBg, borderWidth: 1, borderColor: 'rgba(217,119,6,0.25)', borderRadius: radius.md, padding: space(3.5) },
  capTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  capSub: { fontSize: 11.5, color: '#A16207', marginTop: 3, lineHeight: 16 },
  list: { paddingHorizontal: space(4), paddingBottom: space(8) },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space(3), marginBottom: space(2), gap: space(3) },
  img: { width: 52, height: 52, borderRadius: radius.sm, backgroundColor: colors.base },
  imgPh: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  pTitle: { fontSize: 13, fontWeight: '700', color: colors.ink, lineHeight: 18 },
  pMeta: { fontSize: 11, color: colors.secondary, fontWeight: '600', marginTop: 3 },
  shareBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 12 },
  shareBtnText: { fontSize: 12, fontWeight: '800', color: colors.ink },
  empty: { alignItems: 'center', paddingTop: space(16), paddingHorizontal: space(6) },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  emptySub: { fontSize: 13, color: colors.secondary, textAlign: 'center', marginTop: space(2), lineHeight: 19 },
})
