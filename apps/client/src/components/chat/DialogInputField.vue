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
      :rows="rows"
      outlined
      dense
      class="dialog-input"
    >
      <template v-if="icon" #prepend>
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
  icon?: string;
  type?: InputType;
  placeholder?: string;
  rows?: number;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const handleUpdate = (value: string | number | null) => {
  emit('update:modelValue', String(value || ''));
};
</script>

<style scoped>
:deep(.dialog-input .q-field__control) {
  border-radius: 8px;
  min-height: 40px;
}

:deep(.dialog-input .q-field__control:before) {
  border-color: var(--app-border-strong);
}

:deep(.dialog-input.q-field--focused .q-field__control:before),
:deep(.dialog-input.q-field--focused .q-field__control:after) {
  border-color: var(--app-primary);
}

:deep(.dialog-input .q-field__control:after) {
  transition: all 0.3s;
}

.text-gray-700 {
  color: var(--app-text);
}
</style>
