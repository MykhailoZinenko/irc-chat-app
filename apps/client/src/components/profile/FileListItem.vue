<template>
  <button 
    @click="$emit('click')"
    class="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
  >
    <div :class="['w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', iconBg]">
      <q-icon :name="icon" size="20px" :class="iconColor" />
    </div>
    <div class="flex-1 text-left min-w-0">
      <p class="text-sm font-medium text-gray-800 truncate">{{ title }}</p>
      <p class="text-xs text-gray-500 truncate">{{ subtitle }}</p>
    </div>
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon: string;
  title: string;
  subtitle: string;
  iconBg?: string;
  iconColor?: string;
}>(), {
  iconBg: 'bg-blue-100',
  iconColor: 'text-blue-500'
});

defineEmits<{
  'click': [];
}>();
</script>