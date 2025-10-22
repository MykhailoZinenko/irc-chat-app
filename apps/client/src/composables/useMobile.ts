import { ref } from 'vue'

const drawerOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')

export const useMobile = () => {
  const toggleDrawer = () => {
    drawerOpen.value = !drawerOpen.value
  }

  const openDrawer = () => {
    drawerOpen.value = true
  }

  const closeDrawer = () => {
    drawerOpen.value = false
  }

  const openSearch = () => {
    searchOpen.value = true
  }

  const closeSearch = () => {
    searchOpen.value = false
    searchQuery.value = ''
  }

  const clearSearch = () => {
    searchQuery.value = ''
  }

  return {
    // State
    drawerOpen,
    searchOpen,
    searchQuery,

    // Actions
    toggleDrawer,
    openDrawer,
    closeDrawer,
    openSearch,
    closeSearch,
    clearSearch
  }
}