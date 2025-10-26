<template>
  <button 
    @click="$emit('click')"
    class="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-lg transition-colors"
  >
    <div 
      :class="[
        'w-12 h-12 rounded-full flex items-center justify-center',
        bgColor
      ]"
    >
      <q-icon :name="icon" size="20px" :class="iconColor" />
    </div>
    <span class="text-xs text-gray-700 font-medium">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  bgColor: string;
  iconColor: string;
}>();

defineEmits<{
  'click': [];
}>();
</script>