import { defineStore, acceptHMRUpdate } from 'pinia'
import { api } from 'boot/axios'
import { Notify } from 'quasar'

export interface PublicUser {
  id: number
  firstName: string | null
  lastName: string | null
  nickName: string
  fullName: string
  createdAt: string
}

export interface Contact {
  id: number
  user: PublicUser
  createdAt: string
}

export interface SearchResponse {
  success: boolean
  data: PublicUser[]
}

export interface ContactResponse {
  success: boolean
  data: Contact[]
}

export interface ContactActionResponse {
  success: boolean
  message: string
  data?: Contact
}

export interface ProfileResponse {
  success: boolean
  data: PublicUser
}

export const useContactStore = defineStore('contact', {
  state: () => ({
    contacts: [] as Contact[],
    searchResults: [] as PublicUser[],
    isLoading: false,
    isSearching: false,
  }),

  getters: {
    isUserInContacts: (state) => (userId: number) => {
      return state.contacts.some(contact => contact.user.id === userId)
    },
    contactsCount: (state) => state.contacts.length,
  },

  actions: {
    async searchUsers(query: string) {
      if (!query.trim()) {
        this.searchResults = []
        return
      }

      this.isSearching = true
      try {
        const response = await api.get<SearchResponse>('/api/users/search', {
          params: { q: query.trim() }
        })

        if (response.data.success) {
          this.searchResults = response.data.data
        } else {
          this.searchResults = []
        }
      } catch (error: any) {
        console.error('Search error:', error)
        this.searchResults = []
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Search failed',
        })
      } finally {
        this.isSearching = false
      }
    },

    async fetchUserProfile(userId: string | number) {
      this.isLoading = true
      try {
        const response = await api.get<ProfileResponse>(`/api/users/${userId}/profile`)

        if (response.data.success) {
          return response.data.data
        } else {
          return null
        }
      } catch (error: any) {
        console.error('Profile fetch error:', error)
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to fetch user profile',
        })
        return null
      } finally {
        this.isLoading = false
      }
    },

    async fetchContacts() {
      this.isLoading = true
      try {
        const response = await api.get<ContactResponse>('/api/contacts')

        if (response.data.success) {
          this.contacts = response.data.data
        }
      } catch (error: any) {
        console.error('Fetch contacts error:', error)
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to fetch contacts',
        })
      } finally {
        this.isLoading = false
      }
    },

    async addContact(userId: number) {
      this.isLoading = true
      try {
        const response = await api.post<ContactActionResponse>(`/api/contacts/${userId}`)

        if (response.data.success && response.data.data) {
          this.contacts.unshift(response.data.data)
          Notify.create({
            type: 'positive',
            message: response.data.message,
          })
          return true
        } else {
          return false
        }
      } catch (error: any) {
        console.error('Add contact error:', error)
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to add contact',
        })
        return false
      } finally {
        this.isLoading = false
      }
    },

    async removeContact(userId: number) {
      this.isLoading = true
      try {
        const response = await api.delete<ContactActionResponse>(`/api/contacts/${userId}`)

        if (response.data.success) {
          this.contacts = this.contacts.filter(contact => contact.user.id !== userId)
          Notify.create({
            type: 'positive',
            message: response.data.message,
          })
          return true
        } else {
          return false
        }
      } catch (error: any) {
        console.error('Remove contact error:', error)
        Notify.create({
          type: 'negative',
          message: error.response?.data?.message || 'Failed to remove contact',
        })
        return false
      } finally {
        this.isLoading = false
      }
    },

    clearSearchResults() {
      this.searchResults = []
    },

    copyNickname(nickname: string) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(nickname).then(() => {
          Notify.create({
            type: 'positive',
            message: `Copied @${nickname} to clipboard`,
          })
        }).catch(() => {
          Notify.create({
            type: 'negative',
            message: 'Failed to copy nickname',
          })
        })
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = nickname
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        try {
          document.execCommand('copy')
          Notify.create({
            type: 'positive',
            message: `Copied @${nickname} to clipboard`,
          })
        } catch (err) {
          Notify.create({
            type: 'negative',
            message: 'Failed to copy nickname',
          })
        }
        document.body.removeChild(textArea)
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useContactStore, import.meta.hot))
}