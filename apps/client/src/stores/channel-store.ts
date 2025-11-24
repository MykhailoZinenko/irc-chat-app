import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'src/boot/axios'
import { Notify } from 'quasar'

export interface Channel {
  id: number
  type: 'private' | 'public'
  name: string
  description: string | null
  createdBy: number
  role: 'member' | 'admin'
  joinedAt: string
  lastActivityAt: string | null
}

interface CreateChannelData {
  type: 'private' | 'public'
  name: string
  description?: string
}

export const useChannelStore = defineStore('channel', () => {
  const channels = ref<Channel[]>([])
  const loading = ref(false)

  const fetchChannels = async () => {
    loading.value = true
    try {
      const response = await api.get<{ success: boolean; data: { channels: Channel[] } }>(
        '/api/channels'
      )
      if (response.data.success) {
        channels.value = response.data.data.channels
      }
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to fetch channels',
      })
    } finally {
      loading.value = false
    }
  }

  const createChannel = async (data: CreateChannelData) => {
    try {
      const response = await api.post<{ success: boolean; data: { channel: any } }>(
        '/api/channels',
        data
      )
      if (response.data.success) {
        await fetchChannels()
        Notify.create({
          type: 'positive',
          message: 'Channel created successfully',
        })
        return { success: true, channel: response.data.data.channel }
      }
      return { success: false }
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to create channel',
      })
      return { success: false }
    }
  }

  const leaveChannel = async (channelId: number) => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/channels/${channelId}/leave`
      )
      if (response.data.success) {
        await fetchChannels()
        Notify.create({
          type: 'positive',
          message: response.data.message,
        })
        return { success: true }
      }
      return { success: false }
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to leave channel',
      })
      return { success: false }
    }
  }

  const deleteChannel = async (channelId: number) => {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/api/channels/${channelId}`
      )
      if (response.data.success) {
        await fetchChannels()
        Notify.create({
          type: 'positive',
          message: response.data.message,
        })
        return { success: true }
      }
      return { success: false }
    } catch (error: any) {
      Notify.create({
        type: 'negative',
        message: error.response?.data?.message || 'Failed to delete channel',
      })
      return { success: false }
    }
  }

  return {
    channels,
    loading,
    fetchChannels,
    createChannel,
    leaveChannel,
    deleteChannel,
  }
})
