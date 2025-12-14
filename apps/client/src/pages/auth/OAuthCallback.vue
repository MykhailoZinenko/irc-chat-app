<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <q-spinner size="48px" color="blue" />
      <p class="mt-4 text-gray-600">Completing authentication...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

onMounted(() => {
  const token = route.query.token as string;
  const error = route.query.error as string;

  if (window.opener) {
    if (token) {
      window.opener.postMessage(
        {
          type: 'oauth_success',
          token: token,
        },
        window.location.origin
      );
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: 'Access was denied',
        state_mismatch: 'Security check failed. Please try again',
        unknown: 'An error occurred during authentication',
      };

      window.opener.postMessage(
        {
          type: 'oauth_error',
          error: errorMessages[error] || 'Authentication failed',
        },
        window.location.origin
      );
    }

    // Close popup after a short delay
    setTimeout(() => {
      window.close();
    }, 100);
  }
});
</script>
