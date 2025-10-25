<template>
  <button
    @click="$emit('click')"
    :disabled="disabled || false"
    :class="[
      'w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold transition-all shadow-md',
      disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:from-blue-600 hover:to-purple-600 hover:shadow-lg transform hover:-translate-y-0.5'
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  disabled?: boolean;
}>(), {
  disabled: false
});

defineEmits<{
  'click': [];
}>();
</script>

<style scoped>
.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-blue-500 {
  --tw-gradient-from: #3b82f6;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0));
}

.to-purple-500 {
  --tw-gradient-to: #a855f7;
}

button:active:not(:disabled) {
  transform: scale(0.98);
}
</style>