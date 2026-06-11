import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { useEntitlements } from '@/lib/queries'
import { registerForPush, unregisterPush } from '@/lib/notifications'
import { colors, radius, space } from '@/lib/theme'

const extra = Constants.expoConfig?.extra ?? {}

export default function SettingsScreen() {
  const { data: ent } = useEntitlements()
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [showDelete, setShowDelete] = useState(false)

  const signOut = async () => {
    await unregisterPush()
    await supabase.auth.signOut()
  }

  // App Store 5.1.1(v) / Play account-deletion policy: in-app deletion required
  const deleteAccount = async () => {
    if (confirmText !== 'DELETE') {
      Alert.alert('Type DELETE to confirm', 'This protects you from accidental deletion.')
      return
    }
    setDeleting(true)
    const { error } = await api('/api/v1/account', { method: 'DELETE', body: { confirm: 'DELETE' } })
    setDeleting(false)
    if (error) {
      Alert.alert('Could not delete account', error.message)
      return
    }
    await supabase.auth.signOut()
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>Settings</Text>

        {/* Plan — read-only on mobile (no in-app purchases; billing happens on the web) */}
        <Text style={s.section}>Your plan</Text>
        <View style={s.card}>
          <Text style={s.planName}>{ent?.plan.public_name || '—'}</Text>
          <Text style={s.planMeta}>
            Status: {ent?.plan.status || '—'}
            {ent?.plan.current_period_end ? ` · renews ${new Date(ent.plan.current_period_end).toLocaleDateString('en-IN')}` : ''}
          </Text>
          <Text style={s.planNote}>Manage your subscription from the LaunchGrid web dashboard.</Text>
        </View>

        <Text style={s.section}>Notifications</Text>
        <View style={s.card}>
          <TouchableOpacity onPress={() => registerForPush()}>
            <Text style={s.rowText}>Enable order alerts</Text>
            <Text style={s.rowSub}>Instant notification when someone places an order</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.section}>Legal</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL(extra.privacyPolicyUrl || 'https://launchgrid.in/legal/privacy')}>
            <Text style={s.rowText}>Privacy Policy</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL(extra.termsUrl || 'https://launchgrid.in/legal/terms')}>
            <Text style={s.rowText}>Terms of Service</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL('https://launchgrid.in/support')}>
            <Text style={s.rowText}>Support</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.section}>Account</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={signOut}>
            <Text style={s.rowText}>Sign out</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          {!showDelete ? (
            <TouchableOpacity style={s.row} onPress={() => setShowDelete(true)}>
              <Text style={[s.rowText, { color: colors.red }]}>Delete account</Text>
              <Text style={s.rowSub}>Permanently removes your store and all data</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.row}>
              <Text style={[s.rowText, { color: colors.red }]}>This permanently deletes your store, products, and order history.</Text>
              <TextInput
                style={s.confirmInput}
                value={confirmText}
                onChangeText={setConfirmText}
                placeholder='Type DELETE to confirm'
                placeholderTextColor={colors.subtle}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={s.deleteBtn} onPress={deleteAccount} disabled={deleting}>
                <Text style={s.deleteBtnText}>{deleting ? 'Deleting…' : 'Permanently delete my account'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowDelete(false); setConfirmText('') }}>
                <Text style={[s.rowSub, { textAlign: 'center', marginTop: space(2) }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={s.version}>LaunchGrid v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  scroll: { padding: space(4), paddingBottom: space(10) },
  title: { fontSize: 22, fontWeight: '800', color: colors.ink, marginBottom: space(4) },
  section: { fontSize: 11, fontWeight: '800', color: colors.subtle, textTransform: 'uppercase', letterSpacing: 1, marginBottom: space(2), marginTop: space(3) },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space(4) },
  planName: { fontSize: 17, fontWeight: '800', color: colors.ink },
  planMeta: { fontSize: 12, color: colors.secondary, fontWeight: '600', marginTop: 3 },
  planNote: { fontSize: 11, color: colors.subtle, marginTop: space(2), lineHeight: 16 },
  row: { paddingVertical: space(1) },
  rowText: { fontSize: 14, fontWeight: '700', color: colors.ink },
  rowSub: { fontSize: 11, color: colors.secondary, marginTop: 2, lineHeight: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: space(2.5) },
  confirmInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: space(3), marginTop: space(3), fontSize: 14, fontWeight: '700', color: colors.ink },
  deleteBtn: { backgroundColor: colors.red, borderRadius: radius.sm, padding: space(3.5), alignItems: 'center', marginTop: space(3) },
  deleteBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  version: { fontSize: 11, color: colors.subtle, textAlign: 'center', marginTop: space(6) },
})
