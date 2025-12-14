<template>
  <div class="appearance-settings">
    <div class="section-card">
      <div class="section-head">
        <div>
          <h3 class="section-title">Theme mode</h3>
          <p class="section-subtitle">
            Choose light or dark, or follow your device preference. Saved on this device.
          </p>
        </div>
        <span class="chip">Currently {{ effectiveModeLabel }}</span>
      </div>

      <div class="mode-toggle">
        <q-btn-toggle
          v-model="modeModel"
          unelevated
          no-caps
          rounded
          toggle-color="primary"
          color="grey-6"
          :options="modeOptions"
          class="mode-toggle__control"
        />
        <p class="helper-text">{{ modeHelper }}</p>
      </div>
    </div>

    <div class="section-card">
      <div class="section-head">
        <div>
          <h3 class="section-title">Accent themes</h3>
          <p class="section-subtitle">
            Swap the app accent, gradients, and highlight colors. Works in both light and dark.
          </p>
        </div>
        <span class="chip chip--muted">Instant apply</span>
      </div>

      <div class="theme-grid">
        <button
          v-for="theme in themeCards"
          :key="theme.id"
          class="theme-tile"
          :class="{ 'is-active': theme.id === selectedTheme }"
          @click="pickTheme(theme.id)"
        >
          <div
            class="theme-tile__swatch"
            :style="{ background: `linear-gradient(135deg, ${theme.preview[0]}, ${theme.preview[1]})` }"
          >
            <span
              class="theme-tile__dot"
              :style="{ backgroundColor: theme.preview[0] }"
            />
            <span
              class="theme-tile__dot"
              :style="{ backgroundColor: theme.preview[1] }"
            />
          </div>
          <div class="theme-tile__body">
            <div class="theme-tile__name">{{ theme.label }}</div>
            <div class="theme-tile__desc">{{ theme.description }}</div>
          </div>
          <q-icon
            v-if="theme.id === selectedTheme"
            name="check_circle"
            size="20px"
            color="primary"
          />
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { themePresets, useAppearanceStore, type ThemeId, type ThemeMode } from '@/stores/appearance-store'

const appearanceStore = useAppearanceStore()

const modeModel = computed<ThemeMode>({
  get: () => appearanceStore.mode,
  set: (value) => appearanceStore.setMode(value),
})

const selectedTheme = computed(() => appearanceStore.theme)
const effectiveMode = computed(() => appearanceStore.effectiveMode)

const modeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'System', value: 'system' },
  { label: 'Dark', value: 'dark' },
]

const modeHelper = computed(() => {
  if (appearanceStore.mode === 'system') {
    return `Following system (${effectiveMode.value === 'dark' ? 'dark' : 'light'} right now)`
  }
  return appearanceStore.mode === 'dark' ? 'Forces dark across the app' : 'Forces light across the app'
})

const effectiveModeLabel = computed(() => (effectiveMode.value === 'dark' ? 'Dark' : 'Light'))

const themeCards = computed(() =>
  Object.entries(themePresets).map(([id, def]) => ({
    id: id as ThemeId,
    ...def,
  }))
)

const pickTheme = (id: ThemeId) => {
  appearanceStore.setTheme(id)
}
</script>
<style scoped>
.appearance-settings {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: var(--app-shadow-soft);
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.section-title {
  margin: 0;
  color: var(--app-text-strong);
  font-size: 1.05rem;
  font-weight: 600;
}

.section-subtitle {
  margin: 0.25rem 0 0;
  color: var(--app-text-muted);
  font-size: 0.95rem;
}

.chip {
  align-self: center;
  background: var(--app-surface-muted);
  color: var(--app-text);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.chip--muted {
  color: var(--app-text-soft);
}

.mode-toggle {
  margin-top: 1rem;
}

.mode-toggle__control {
  width: 100%;
}

.helper-text {
  color: var(--app-text-muted);
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
}

.theme-grid {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.theme-tile {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--app-surface-muted);
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 0.75rem;
  transition: all 0.2s ease;
  cursor: pointer;
  text-align: left;
}

.theme-tile:hover {
  border-color: var(--app-border-strong);
  box-shadow: var(--app-shadow-soft);
}

.theme-tile.is-active {
  border-color: var(--app-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--app-primary) 20%, transparent);
}

.theme-tile__swatch {
  width: 64px;
  height: 56px;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--app-shadow-soft);
}

.theme-tile__dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.7);
  position: absolute;
  bottom: 8px;
}

.theme-tile__dot:first-of-type {
  left: 10px;
}

.theme-tile__dot:last-of-type {
  right: 10px;
}

.theme-tile__body {
  flex: 1;
}

.theme-tile__name {
  font-weight: 600;
  color: var(--app-text-strong);
  margin-bottom: 0.15rem;
}

.theme-tile__desc {
  color: var(--app-text-muted);
  font-size: 0.9rem;
}

@media (max-width: 640px) {
  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .chip {
    align-self: flex-start;
  }
}
</style>
