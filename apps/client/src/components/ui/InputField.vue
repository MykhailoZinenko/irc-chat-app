<template>
  <div>
    <label class="block text-sm font-medium text-gray-700 mb-2">
      {{ label }}
    </label>
    <q-input
      :model-value="modelValue"
      @update:model-value="handleUpdate"
      :type="type || 'text'"
      :placeholder="placeholder || ''"
      @keypress.enter="$emit('enter')"
      outlined
      class="auth-input"
    >
      <template v-slot:prepend>
        <q-icon :name="icon" size="20px" class="text-gray-400" />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local' | 'file' | 'textarea';

defineProps<{
  modelValue: string;
  label: string;
  icon: string;
  type?: InputType;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'enter': [];
}>();

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