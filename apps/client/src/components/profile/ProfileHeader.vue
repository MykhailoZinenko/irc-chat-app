<template>
  <div class="bg-white border-b border-gray-200 px-4 flex items-center h-16">
    <button
      @click="$emit('back')"
      class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
