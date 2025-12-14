import { defineBoot } from '#q-app/wrappers'
import { usePresenceStore } from '@/stores/presence-store'

// Ensure presence state is initialized early so connection mode is respected
export default defineBoot(() => {
  usePresenceStore()
})
