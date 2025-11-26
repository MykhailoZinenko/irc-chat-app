import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { AppVisibility, Notify } from 'quasar'
import type { ChannelMessage } from './message-store'

type ChannelKind = 'private' | 'public'

type NotificationPrefs = {
  privateChannels: boolean
  publicChannels: boolean
  mentions: boolean
}

const STORAGE_KEY = 'notification-prefs'

const defaultPrefs: NotificationPrefs = {
  privateChannels: false,
  publicChannels: false,
  mentions: false,
}

function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultPrefs }
    const parsed = JSON.parse(raw)
    return { ...defaultPrefs, ...parsed }
  } catch {
    return { ...defaultPrefs }
  }
}

function savePrefs(prefs: NotificationPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const useNotificationStore = defineStore('notification', () => {
  const preferences = reactive<NotificationPrefs>(loadPrefs())
  const anyPrefEnabled = () =>
    preferences.privateChannels || preferences.publicChannels || preferences.mentions

  const setPreference = (key: keyof NotificationPrefs, value: boolean) => {
    preferences[key] = value
    savePrefs(preferences)
    if (value) {
      void ensurePermission()
    }
  }

  const ensurePermission = async () => {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') return true
    if (Notification.permission === 'denied') {
      Notify.create({
        type: 'negative',
        message: 'Notifications are blocked. Please allow them in your browser settings.',
      })
      return false
    }
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  const shouldNotify = (channelType: ChannelKind, isMention: boolean) => {
    if (isMention && preferences.mentions) return true
    if (channelType === 'private') return preferences.privateChannels
    return preferences.publicChannels
  }

  if (anyPrefEnabled()) {
    void ensurePermission()
  }

  const appIsVisible = () => {
    const anyVis = AppVisibility as any
    if (typeof anyVis?.appVisible === 'boolean') return anyVis.appVisible
    if (typeof anyVis?.isVisible === 'function') return anyVis.isVisible()
    if (typeof document !== 'undefined' && typeof document.hidden === 'boolean') {
      return !document.hidden
    }
    return false
  }

  const maybeNotifyMessage = async (options: {
    message: ChannelMessage
    channelType: ChannelKind
    activeChannelId: number | null
    currentUserId: number | undefined
    currentUserNick: string | undefined
  }) => {
    const { message, channelType, activeChannelId, currentUserId, currentUserNick } = options

    if (currentUserId && message.senderId === currentUserId) return

    if (appIsVisible()) return;
    if (activeChannelId && activeChannelId === message.channelId) return

    const isMention =
      !!currentUserNick &&
      new RegExp(`(^|\\s|[^\\w])@${escapeRegex(currentUserNick)}\\b`, 'i').test(
        message.content || ''
      )

    if (!shouldNotify(channelType, isMention)) return

    const allowed = await ensurePermission()
    if (!allowed) return

    const title = message.sender.nickName || message.sender.fullName || 'New message'
    const maxLen = 150
    const body =
      message.content.length > maxLen
        ? `${message.content.slice(0, maxLen - 3)}...`
        : message.content

    if (typeof Notification !== 'undefined') {
      new Notification(title, {
        body,
         tag: `channel-${message.channelId}-msg-${message.id}`,
      })
    } else {
      Notify.create({
        type: 'info',
        message: title,
        caption: body,
        timeout: 1500,
      })
    }
  }

  return {
    preferences,
    setPreference,
    ensurePermission,
    maybeNotifyMessage,
  }
})
