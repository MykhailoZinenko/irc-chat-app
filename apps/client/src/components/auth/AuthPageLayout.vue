<template>
  <div class="min-h-screen app-gradient-soft flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 app-gradient rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
          💬
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">{{ title }}</h1>
        <p class="text-gray-600">{{ subtitle }}</p>
      </div>

      <!-- Content Card -->
      <div class="auth-card rounded-2xl p-8">
        <slot />
      </div>

      <!-- Footer Link -->
      <p v-if="footerText" class="text-center mt-5 text-gray-600">
        {{ footerText }}
        <router-link
        :to="footerLinkHref || '/404'"
        class="text-blue-500 hover:text-blue-600 font-semibold transition-colors"
        >
          {{ footerLinkText }}
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
}>();
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}

.auth-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow-strong);
  transition: background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
</style>
