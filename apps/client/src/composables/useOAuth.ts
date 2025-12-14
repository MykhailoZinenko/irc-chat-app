import { Notify } from 'quasar';
import { useAuthStore } from 'src/stores/auth-store';
import { useRouter } from 'vue-router';

export function useOAuth() {
  const authStore = useAuthStore();
  const router = useRouter();

  const openOAuthPopup = (provider: 'google' | 'github') => {
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      `http://localhost:3333/auth/${provider}`,
      `${provider}_oauth`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no`
    );

    if (!popup) {
      Notify.create({
        type: 'negative',
        message: 'Please allow popups for OAuth login',
        position: 'top',
        timeout: 4000,
      });
      return;
    }

    // Listen for the OAuth callback
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'oauth_success' && event.data.token) {
        popup.close();
        window.removeEventListener('message', handleMessage);

        // Store the token and fetch user
        authStore.token = event.data.token;
        localStorage.setItem('auth_token', event.data.token);
        authStore.setAuthHeaders();

        void authStore.fetchUser().then((success) => {
          if (success) {
            Notify.create({
              type: 'positive',
              message: `Logged in successfully with ${provider}`,
              position: 'top',
              timeout: 3000,
            });
            void router.push('/chat');
          } else {
            Notify.create({
              type: 'negative',
              message: 'Failed to fetch user data',
              position: 'top',
              timeout: 4000,
            });
          }
        });
      } else if (event.data.type === 'oauth_error') {
        popup.close();
        window.removeEventListener('message', handleMessage);

        Notify.create({
          type: 'negative',
          message: event.data.error || 'OAuth login failed',
          position: 'top',
          timeout: 4000,
        });
      }
    };

    window.addEventListener('message', handleMessage);

    // Check if popup is closed without completing OAuth
    const popupInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(popupInterval);
        window.removeEventListener('message', handleMessage);
      }
    }, 500);
  };

  return {
    openOAuthPopup,
  };
}
