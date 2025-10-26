<template>
  <div class="px-4 py-4 border-b border-gray-200">
    <div v-if="title" class="flex items-center justify-between mb-3">
      <p :class="['text-sm', titleBold ? 'font-semibold text-gray-800' : 'text-gray-600']">
        {{ title }}
      </p>
      <span v-if="count !== undefined" class="text-sm text-gray-500">{{ count }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title?: string;
  count?: number;
  titleBold?: boolean;
}>(), {
  titleBold: false
});
</script>
