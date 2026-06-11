import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { api } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

/**
 * Ask for permission at a meaningful moment (after login), register the
 * Expo push token with the backend. Store policy: permission prompts must
 * be contextual — we pitch "never miss an order" on the dashboard first.
 */
export async function registerForPush(): Promise<boolean> {
  if (!Device.isDevice) return false

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order alerts',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF8A00',
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status
  }
  if (status !== 'granted') return false

  const token = (await Notifications.getExpoPushTokenAsync()).data

  await api('/api/v1/devices', {
    method: 'POST',
    body: {
      push_token: token,
      platform: Platform.OS,
      device_name: Device.modelName,
      app_version: '1.0.0',
    },
  })
  return true
}

export async function unregisterPush() {
  try {
    if (!Device.isDevice) return
    const token = (await Notifications.getExpoPushTokenAsync()).data
    await api('/api/v1/devices', { method: 'DELETE', body: { push_token: token } })
  } catch { /* best effort on logout */ }
}
