import { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 24 * 60 * 60 * 1000, // keep for offline reads
      retry: 2,
    },
    mutations: { retry: 0 }, // mutations never auto-retry blindly
  },
})

// Offline-first: persist the query cache so orders/products render instantly
const persister = createAsyncStoragePersister({ storage: AsyncStorage })

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSignedIn(!!session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Deep-link notification taps straight to the order
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as { type?: string; order_id?: string }
      if (data?.type === 'order' && data.order_id) {
        router.push(`/order/${data.order_id}`)
      }
    })
    return () => sub.remove()
  }, [])

  // Route guard
  useEffect(() => {
    if (!ready) return
    router.replace(signedIn ? '/(tabs)' : '/(auth)/login')
  }, [ready, signedIn])

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <StatusBar style="dark" backgroundColor={colors.base} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.base } }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="order/[id]"
          options={{ headerShown: true, title: 'Order', headerTintColor: colors.ink }}
        />
      </Stack>
    </PersistQueryClientProvider>
  )
}
