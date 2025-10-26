<template>
  <div class="bg-white border-b border-gray-200 px-4 flex items-center justify-between h-16">
    <div class="flex items-center gap-3">
      <button 
        @click="$emit('back')"
        class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <q-icon name="arrow_back" size="20px" class="text-gray-600" />
      </button>
      <div>
        <h2 class="font-semibold text-gray-800">{{ title }}</h2>
        <p class="text-xs text-gray-500">{{ subtitle }}</p>
      </div>
    </div>
    <button 
      @click="$emit('more')"
      class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <q-icon name="more_vert" size="20px" class="text-gray-600" />
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
}>();

defineEmits<{
  'back': [];
  'more': [];
}>();
</script>
