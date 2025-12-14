<template>
  <div class="profile-header px-4 flex items-center h-16">
    <button
      @click="$emit('back')"
      class="p-2 header-btn rounded-lg transition-colors"
    >
      <q-icon name="arrow_back" size="20px" class="text-gray-600" />
    </button>
    <div class="ml-3">
      <h2 class="font-semibold text-gray-800 truncate text-base leading-6">{{ title }}</h2>
      <p class="text-sm text-gray-500 truncate leading-tight">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
}>();

defineEmits<{
  'back': [];
}>();
</script>

<style scoped>
.profile-header {
  background: var(--app-surface);
  border-bottom: 1px solid var(--app-border);
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

.header-btn:hover {
  background: color-mix(in srgb, var(--app-surface-muted) 80%, transparent);
}
</style>
