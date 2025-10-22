import { boot } from 'quasar/wrappers'
import { useTransmit } from 'src/services/transmit'

export default boot(({ router }) => {
  const { connectWhenAuthenticated, isConnected } = useTransmit()

  // Connect to Transmit when navigating to authenticated routes
  router.beforeEach((to) => {
    if (to.meta.requiresAuth !== false) {
      // Only connect if not already connected to avoid multiple connections
      if (!isConnected()) {
        console.log('Connecting to Transmit via router navigation')
        connectWhenAuthenticated()
      }
    }
  })
})