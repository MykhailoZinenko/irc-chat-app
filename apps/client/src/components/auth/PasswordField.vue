<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <q-icon name="lock" size="20px" class="text-gray-400" />
      </div>
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :type="showPassword ? 'text' : 'password'"
        :placeholder="placeholder || ''"
        @keypress.enter="$emit('enter')"
        class="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
      <button
        type="button"
        @mousedown.prevent
        @click="showPassword = !showPassword"
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
      >
        <q-icon 
          :name="showPassword ? 'visibility_off' : 'visibility'" 
          size="20px" 
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
  'enter': [];
}>();

const showPassword = ref(false);
</script>

<style scoped>
input:focus {
  outline: none;
}
</style>