import { defineBoot } from '#q-app/wrappers'
import { useAppearanceStore } from '@/stores/appearance-store'

export default defineBoot(() => {
  const appearanceStore = useAppearanceStore()
  appearanceStore.init()
})
