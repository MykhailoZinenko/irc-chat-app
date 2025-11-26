<template>
  <div class="settings-toggle">
    <div class="settings-toggle__content">
      <slot name="icon">
        <div v-if="icon" class="settings-toggle__icon">
          <component :is="icon" />
        </div>
      </slot>
      <div class="settings-toggle__text">
        <p class="settings-toggle__title">{{ title }}</p>
        <p class="settings-toggle__description">{{ description }}</p>
      </div>
    </div>
    <div class="settings-toggle__control">
      <q-toggle
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :color="color"
        :disable="disable"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
  modelValue: boolean
  color?: string
  disable?: boolean
  icon?: any
}

withDefaults(defineProps<Props>(), {
  color: 'blue',
  disable: false,
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.settings-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
}

.settings-toggle:last-child {
  border-bottom: none;
}

.settings-toggle__content {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
}

.settings-toggle__icon {
  margin-top: 0.25rem;
  color: #6b7280;
  width: 1.25rem;
  height: 1.25rem;
}

.settings-toggle__text {
  flex: 1;
}

.settings-toggle__title {
  font-weight: 500;
  color: #1f2937;
  margin: 0;
  font-size: 0.9375rem;
}

.settings-toggle__description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.settings-toggle__control {
  margin-left: 1rem;
}
</style>