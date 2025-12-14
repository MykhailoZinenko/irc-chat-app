<template>
  <button
    @click="$emit('click')"
    class="action-button"
  >
    <div
      :class="[
        'action-button__icon',
        bgColor
      ]"
    >
      <q-icon :name="icon" size="20px" :class="iconColor" />
    </div>
    <span class="action-button__label">{{ label }}</span>
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

<style scoped>
.action-button {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.action-button:hover {
  background: var(--app-surface-muted-strong);
  box-shadow: var(--app-shadow-soft);
}

.action-button__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-button__label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-text-strong);
}
</style>
