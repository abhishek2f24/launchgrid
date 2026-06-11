import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Linking, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '@/lib/supabase'
import { colors, radius, space } from '@/lib/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    if (!email || !password) { setError('Enter your email and password.'); return }
    setLoading(true); setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) setError(error.message)
    // success: root layout's auth listener redirects to tabs
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
        <View style={s.container}>
          <View style={s.brandRow}>
            <View style={s.dot} />
            <Text style={s.brand}>LaunchGrid</Text>
          </View>
          <Text style={s.h1}>Your business,{'\n'}in your pocket.</Text>
          <Text style={s.sub}>Sign in with your LaunchGrid account.</Text>

          {error && <Text style={s.error}>{error}</Text>}

          <Text style={s.label}>EMAIL</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="founder@example.com"
            placeholderTextColor={colors.subtle}
          />

          <Text style={s.label}>PASSWORD</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            placeholder="••••••••"
            placeholderTextColor={colors.subtle}
          />

          <TouchableOpacity style={s.btn} onPress={signIn} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Sign in</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Linking.openURL('https://launchgrid.in/forgot-password')}>
            <Text style={s.link}>Forgot password?</Text>
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>
              New to LaunchGrid? Create your store on{' '}
              <Text style={s.footerBold} onPress={() => Linking.openURL('https://launchgrid.in/onboarding?utm_source=mobile_app')}>
                launchgrid.in
              </Text>
              {' '}— it takes 15 minutes, then sign in here.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  flex: { flex: 1 },
  container: { flex: 1, padding: space(6), justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: space(6) },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  brand: { fontSize: 16, fontWeight: '800', color: colors.ink },
  h1: { fontSize: 32, fontWeight: '800', color: colors.ink, lineHeight: 38, marginBottom: space(2) },
  sub: { fontSize: 14, color: colors.secondary, marginBottom: space(6) },
  error: { color: colors.red, backgroundColor: colors.redBg, padding: space(3), borderRadius: radius.sm, fontSize: 13, fontWeight: '600', marginBottom: space(3) },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: colors.subtle, marginBottom: space(1.5), marginTop: space(3) },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: space(3.5), fontSize: 15, fontWeight: '600', color: colors.ink,
  },
  btn: {
    backgroundColor: colors.ink, borderRadius: radius.md, padding: space(4),
    alignItems: 'center', marginTop: space(6),
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  link: { color: colors.secondary, fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: space(4) },
  footer: { marginTop: space(8), paddingTop: space(4), borderTopWidth: 1, borderTopColor: colors.border },
  footerText: { fontSize: 13, color: colors.secondary, textAlign: 'center', lineHeight: 19 },
  footerBold: { fontWeight: '800', color: colors.ink },
})
