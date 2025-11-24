<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>
    <q-input
      :model-value="modelValue"
      @update:model-value="handleUpdate"
      :type="showPassword ? 'text' : 'password'"
      :placeholder="placeholder || ''"
      @keypress.enter="$emit('enter')"
      outlined
      class="auth-input"
    >
      <template v-slot:prepend>
        <q-icon name="lock" size="20px" class="text-gray-400" />
      </template>
      <template v-slot:append>
        <q-icon
          :name="showPassword ? 'visibility_off' : 'visibility'"
          size="20px"
          class="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
          @click="showPassword = !showPassword"
        />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'enter': [];
}>();

const showPassword = ref(false);

const handleUpdate = (value: string | number | null) => {
  emit('update:modelValue', String(value || ''));
};
</script>

<style scoped>
:deep(.auth-input .q-field__control) {
  height: 48px;
  padding-left: 4px;
  border-radius: 8px;
}

:deep(.auth-input .q-field__control:before) {
  border-color: #d1d5db;
}

:deep(.auth-input.q-field--focused .q-field__control:before),
:deep(.auth-input.q-field--focused .q-field__control:after) {
  border-color: #3b82f6;
}

:deep(.auth-input .q-field__control:after) {
  transition: all 0.3s;
}
</style>