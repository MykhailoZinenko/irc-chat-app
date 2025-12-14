<template>
  <q-btn
    :type="type"
    :loading="loading"
    :disable="disabled || loading"
    :color="color"
    :text-color="textColor"
    :outline="variant === 'outline'"
    :unelevated="variant !== 'outline'"
    :no-caps="true"
    :padding="padding"
    :ripple="ripple"
    :class="buttonClasses"
    @click="$emit('click')"
  >
    <slot />
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'gradient' | 'solid' | 'outline';
  tone?: 'primary' | 'danger';
  fullWidth?: boolean;
  padding?: string;
  ripple?: boolean;
}>(), {
  disabled: false,
  loading: false,
  type: 'button',
  variant: 'gradient',
  tone: 'primary',
  fullWidth: true,
  padding: '12px 16px',
  ripple: true
});

defineEmits<{
  'click': [];
}>();

const toneColor = computed(() => (props.tone === 'danger' ? 'negative' : 'primary'));

const color = computed(() => {
  if (props.variant === 'outline') {
    return toneColor.value;
  }
  if (props.variant === 'gradient') {
    // background handled by class, color kept minimal
    return 'transparent';
  }
  return toneColor.value;
});

const textColor = computed(() => (props.variant === 'gradient' ? 'white' : undefined));

const buttonClasses = computed(() => {
  const classes = ['btn-base', props.fullWidth ? 'btn-full' : 'btn-auto'];

  if (props.variant === 'gradient') {
    classes.push('btn-gradient');
  } else if (props.variant === 'outline') {
    classes.push('btn-outline');
  } else {
    classes.push('btn-solid');
  }

  if (props.variant === 'outline' && props.tone === 'danger') {
    classes.push('text-red-6');
  } else if (props.variant === 'outline') {
    classes.push('text-blue-6');
  }

  return classes;
});
</script>

<style scoped>
.btn-base {
  border-radius: 12px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.btn-full {
  width: 100%;
}

.btn-auto {
  width: auto;
}

.btn-gradient {
  color: var(--app-surface);
  background: linear-gradient(90deg, var(--app-gradient-start), var(--app-gradient-end));
  border: none !important;
}

.btn-solid {
  color: var(--app-surface);
}

.btn-outline {
  background: transparent;
}

.btn-base :deep(.q-btn__content) {
  gap: 0.5rem;
}
</style>
