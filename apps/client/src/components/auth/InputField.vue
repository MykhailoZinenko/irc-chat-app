<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <q-icon :name="icon" size="20px" class="text-gray-400" />
      </div>
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :type="type || 'text'"
        :placeholder="placeholder || ''"
        @keypress.enter="$emit('enter')"
        class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  label: string;
  icon: string;
  type?: string;
  placeholder?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
  'enter': [];
}>();
</script>

<style scoped>
input:focus {
  outline: none;
}
</style>