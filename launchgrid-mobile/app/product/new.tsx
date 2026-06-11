import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { router, Stack } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { colors, radius, space } from '@/lib/theme'

/**
 * Camera-based product creation — the mobile twin of the web's URL importer.
 * Photo → title → price → live in the store in under 60 seconds.
 */
export default function NewProductScreen() {
  const queryClient = useQueryClient()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (fromCamera: boolean) => {
    const fn = fromCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Camera access needed', 'Enable camera access in Settings to photograph products.'); return }
    }
    const result = await fn({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (!result.canceled && result.assets?.[0]?.uri) setImageUri(result.assets[0].uri)
  }

  const save = async () => {
    const sellPrice = parseFloat(price)
    if (!title.trim()) { setError('Give your product a name.'); return }
    if (!sellPrice || sellPrice <= 0) { setError('Set a selling price.'); return }
    setSaving(true); setError(null)

    try {
      let imageUrl: string | null = null

      // Upload photo to Supabase Storage (bucket: product-images, folder = user id)
      if (imageUri) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Session expired — sign in again')
        const path = `${user.id}/${Date.now()}.jpg`
        const file = await fetch(imageUri)
        const blob = await file.arrayBuffer()
        const { error: upErr } = await supabase.storage
          .from('product-images')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
        if (upErr) throw new Error(`Photo upload failed: ${upErr.message}`)
        imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
      }

      // Business logic stays server-side: same endpoint the web + extension use
      const { error: apiErr } = await api('/api/products/add', {
        method: 'POST',
        body: {
          title: title.trim(),
          retail_price: sellPrice,
          cost_price: costPrice ? parseFloat(costPrice) : null,
          image_urls: imageUrl ? [imageUrl] : [],
          description: '',
          source_url: null,
        },
      })
      if (apiErr) throw new Error(apiErr.message)

      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['entitlements'] })
      Alert.alert('Product is live ✓', 'It\'s in your catalog and visible on your store.', [
        { text: 'Add another', onPress: () => { setImageUri(null); setTitle(''); setPrice(''); setCostPrice('') } },
        { text: 'Done', onPress: () => router.back() },
      ])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Add product', headerTintColor: colors.ink }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.flex}>
        <ScrollView style={s.safe} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          {error && <Text style={s.error}>{error}</Text>}

          {/* Photo */}
          {imageUri ? (
            <TouchableOpacity onPress={() => pick(true)} activeOpacity={0.85}>
              <Image source={{ uri: imageUri }} style={s.preview} />
              <Text style={s.retake}>Tap to retake</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.photoRow}>
              <TouchableOpacity style={s.photoBtn} onPress={() => pick(true)} activeOpacity={0.85}>
                <Text style={s.photoEmoji}>📷</Text>
                <Text style={s.photoLabel}>Take photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.photoBtn} onPress={() => pick(false)} activeOpacity={0.85}>
                <Text style={s.photoEmoji}>🖼️</Text>
                <Text style={s.photoLabel}>From gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={s.label}>PRODUCT NAME</Text>
          <TextInput
            style={s.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Handmade Jhumka Earrings"
            placeholderTextColor={colors.subtle}
            maxLength={120}
          />

          <View style={s.row}>
            <View style={s.col}>
              <Text style={s.label}>SELLING PRICE (₹)</Text>
              <TextInput
                style={s.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="499"
                placeholderTextColor={colors.subtle}
              />
            </View>
            <View style={s.col}>
              <Text style={s.label}>COST PRICE (₹)</Text>
              <TextInput
                style={s.input}
                value={costPrice}
                onChangeText={setCostPrice}
                keyboardType="numeric"
                placeholder="Optional"
                placeholderTextColor={colors.subtle}
              />
            </View>
          </View>

          {!!price && !!costPrice && parseFloat(price) > 0 && (
            <Text style={s.profit}>
              Profit per sale: ₹{(parseFloat(price) - (parseFloat(costPrice) || 0)).toLocaleString('en-IN')}
            </Text>
          )}

          <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Add to my store</Text>}
          </TouchableOpacity>
          <Text style={s.hint}>You can add a description and more photos later from the dashboard.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: colors.base },
  scroll: { padding: space(4), paddingBottom: space(10) },
  error: { color: colors.red, backgroundColor: colors.redBg, padding: space(3), borderRadius: radius.sm, fontSize: 13, fontWeight: '600', marginBottom: space(3) },
  photoRow: { flexDirection: 'row', gap: space(3), marginBottom: space(4) },
  photoBtn: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', borderRadius: radius.md, padding: space(6), alignItems: 'center' },
  photoEmoji: { fontSize: 28, marginBottom: space(1) },
  photoLabel: { fontSize: 13, fontWeight: '700', color: colors.ink },
  preview: { width: '100%', aspectRatio: 1, borderRadius: radius.md, backgroundColor: colors.card, marginBottom: space(1) },
  retake: { fontSize: 12, color: colors.secondary, fontWeight: '600', textAlign: 'center', marginBottom: space(3) },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: colors.subtle, marginBottom: space(1.5), marginTop: space(3) },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space(3.5), fontSize: 15, fontWeight: '600', color: colors.ink },
  row: { flexDirection: 'row', gap: space(3) },
  col: { flex: 1 },
  profit: { fontSize: 13, fontWeight: '700', color: colors.green, marginTop: space(3) },
  saveBtn: { backgroundColor: colors.ink, borderRadius: radius.md, padding: space(4), alignItems: 'center', marginTop: space(5) },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  hint: { fontSize: 12, color: colors.secondary, textAlign: 'center', marginTop: space(3), lineHeight: 17 },
})
