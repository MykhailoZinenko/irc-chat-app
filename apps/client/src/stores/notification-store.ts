import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { AppVisibility, Notify } from 'quasar'
import type { ChannelMessage } from './message-store'

type ChannelKind = 'private' | 'public'

type NotificationPrefs = {
  privateChannels: boolean
  publicChannels: boolean
  mentions: boolean
  invites: boolean
  inviteResponses: boolean
  channelEvents: boolean
}

const STORAGE_KEY = 'notification-prefs'

const defaultPrefs: NotificationPrefs = {
  privateChannels: false,
  publicChannels: false,
  mentions: false,
  invites: true,
  inviteResponses: true,
  channelEvents: true,
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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')

export const useNotificationStore = defineStore('notification', () => {
  const preferences = reactive<NotificationPrefs>(loadPrefs())

  const anyPrefEnabled = () =>
    preferences.privateChannels ||
    preferences.publicChannels ||
    preferences.mentions ||
    preferences.invites ||
    preferences.inviteResponses ||
    preferences.channelEvents

  const truncate = (text: string, maxLen = 150) =>
    text.length > maxLen ? `${text.slice(0, maxLen - 3)}...` : text

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

  const appIsVisible = () => {
    const anyVis = AppVisibility as any
    if (typeof anyVis?.appVisible === 'boolean') return anyVis.appVisible
    if (typeof anyVis?.isVisible === 'function') return anyVis.isVisible()
    if (typeof document !== 'undefined' && typeof document.hidden === 'boolean') {
      return !document.hidden
    }
    return false
  }

  const maybeNotifyGeneric = async (options: {
    title: string
    body: string
    tag?: string
  }) => {
    if (appIsVisible()) return

    const allowed = await ensurePermission()
    if (!allowed) return

    const safeBody = truncate(options.body, 150)

    if (typeof Notification !== 'undefined') {
      new Notification(options.title, {
        body: safeBody,
        ...(options.tag && { tag: options.tag }), // Only spread if tag exists
      })
    } else {
      Notify.create({
        type: 'info',
        message: options.title,
        caption: safeBody,
        timeout: 1500,
      })
    }
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
    if (appIsVisible()) return
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
    const body = truncate(message.content, 150)

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

  if (anyPrefEnabled()) {
    void ensurePermission()
  }

  return {
    preferences,
    setPreference,
    ensurePermission,
    maybeNotifyMessage,
    maybeNotifyGeneric,
  }
})
