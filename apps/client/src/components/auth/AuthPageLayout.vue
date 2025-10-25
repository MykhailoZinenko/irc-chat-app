<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="text-center mb-6">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
          💬
        </div>
        <h1 class="text-3xl font-bold text-gray-800 mb-2">{{ title }}</h1>
        <p class="text-gray-600">{{ subtitle }}</p>
      </div>

      <!-- Content Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
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

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.from-blue-50 {
  --tw-gradient-from: #eff6ff;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(239, 246, 255, 0));
}

.to-purple-50 {
  --tw-gradient-to: #faf5ff;
}

.from-blue-500 {
  --tw-gradient-from: #3b82f6;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0));
}

.to-purple-500 {
  --tw-gradient-to: #a855f7;
}
</style>