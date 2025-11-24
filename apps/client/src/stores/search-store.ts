import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from 'src/boot/axios'

export interface SearchResultChannel {
  id: number
  type: 'private' | 'public'
  name: string
  description: string | null
  createdBy: number
  resultType: 'user_channel' | 'public_channel'
}

export interface SearchResultUser {
  id: number
  nickName: string
  firstName: string | null
  lastName: string | null
  email: string
  resultType: 'user'
}

export type SearchResult = SearchResultChannel | SearchResultUser

export const useSearchStore = defineStore('search', () => {
  const userChannels = ref<SearchResultChannel[]>([])
  const publicChannels = ref<SearchResultChannel[]>([])
  const users = ref<SearchResultUser[]>([])
  const loading = ref(false)
  const searchQuery = ref('')

  const search = async (query: string) => {
    if (!query.trim()) {
      clearResults()
      return
    }

    searchQuery.value = query
    loading.value = true

    try {
      const response = await api.get<{
        success: boolean
        data: {
          userChannels: SearchResultChannel[]
          publicChannels: SearchResultChannel[]
          users: SearchResultUser[]
        }
      }>('/api/search', {
        params: { query },
      })

      if (response.data.success) {
        userChannels.value = response.data.data.userChannels
        publicChannels.value = response.data.data.publicChannels
        users.value = response.data.data.users
      }
    } catch (error) {
      console.error('Search failed:', error)
      clearResults()
    } finally {
      loading.value = false
    }
  }

  const clearResults = () => {
    userChannels.value = []
    publicChannels.value = []
    users.value = []
    searchQuery.value = ''
  }

  return {
    userChannels,
    publicChannels,
    users,
    loading,
    searchQuery,
    search,
    clearResults,
  }
})
