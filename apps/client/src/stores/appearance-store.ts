import { Dark, setCssVar } from 'quasar'
import { acceptHMRUpdate, defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ThemeId = 'aurora' | 'sunset' | 'forest'

type Palette = {
  surface: string
  surfaceMuted: string
  surfaceStrong: string
  surfaceMutedStrong: string
  neutralWeak: string
  border: string
  borderStrong: string
  textStrong: string
  text: string
  textSoft: string
  textMuted: string
  placeholder: string
  primary: string
  accent: string
  gradientStart: string
  gradientEnd: string
  danger: string
  dangerSoft: string
  positive: string
  positiveSoft: string
  info: string
  infoSoft: string
  overlay: string
  statusOnline: string
  statusDnd: string
  statusOffline: string
  shadowSoft: string
  shadowStrong: string
  scrollbarTrack: string
  scrollbarThumb: string
  scrollbarThumbHover: string
  dark: string
  darkPage: string
}

type ThemeDefinition = {
  label: string
  description: string
  preview: [string, string]
  palettes: Record<'light' | 'dark', Palette>
}

const STORAGE_KEY = 'appearance:preferences'

const lightBase = {
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceStrong: '#eff6ff',
  surfaceMutedStrong: '#e0e7ff',
  neutralWeak: '#e2e8f0',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  textStrong: '#0f172a',
  text: '#111827',
  textSoft: '#475569',
  textMuted: '#64748b',
  placeholder: '#94a3b8',
  danger: '#ef4444',
  dangerSoft: '#fef2f2',
  positive: '#22c55e',
  positiveSoft: '#ecfdf3',
  info: '#06b6d4',
  infoSoft: '#e0f2fe',
  overlay: 'rgba(15, 23, 42, 0.55)',
  statusOnline: '#22c55e',
  statusDnd: '#f59e0b',
  statusOffline: '#94a3b8',
  shadowSoft: '0 12px 40px rgba(15, 23, 42, 0.06)',
  shadowStrong: '0 20px 60px rgba(15, 23, 42, 0.12)',
  scrollbarTrack: '#e2e8f0',
  scrollbarThumb: '#cbd5e1',
  scrollbarThumbHover: '#94a3b8',
  dark: '#0f172a',
  darkPage: '#0b1220',
} satisfies Omit<Palette, 'primary' | 'accent' | 'gradientStart' | 'gradientEnd'>

const darkBase = {
  surface: '#0f172a',
  surfaceMuted: '#0b1220',
  surfaceStrong: '#1e293b',
  surfaceMutedStrong: '#172036',
  neutralWeak: '#111827',
  border: '#1f2937',
  borderStrong: '#334155',
  textStrong: '#e2e8f0',
  text: '#cbd5e1',
  textSoft: '#94a3b8',
  textMuted: '#64748b',
  placeholder: '#475569',
  danger: '#f87171',
  dangerSoft: 'rgba(248, 113, 113, 0.14)',
  positive: '#22c55e',
  positiveSoft: 'rgba(34, 197, 94, 0.14)',
  info: '#38bdf8',
  infoSoft: 'rgba(56, 189, 248, 0.16)',
  overlay: 'rgba(0, 0, 0, 0.65)',
  statusOnline: '#34d399',
  statusDnd: '#fb923c',
  statusOffline: '#475569',
  shadowSoft: '0 12px 26px rgba(0, 0, 0, 0.35)',
  shadowStrong: '0 22px 60px rgba(0, 0, 0, 0.45)',
  scrollbarTrack: '#111827',
  scrollbarThumb: '#1f2937',
  scrollbarThumbHover: '#334155',
  dark: '#0b1220',
  darkPage: '#0b1220',
} satisfies Omit<Palette, 'primary' | 'accent' | 'gradientStart' | 'gradientEnd'>

export const themePresets: Record<ThemeId, ThemeDefinition> = {
  aurora: {
    label: 'Aurora',
    description: 'Cool blue & violet accents',
    preview: ['#3b82f6', '#8b5cf6'],
    palettes: {
      light: {
        ...lightBase,
        primary: '#3b82f6',
        accent: '#8b5cf6',
        gradientStart: '#3b82f6',
        gradientEnd: '#8b5cf6',
      },
      dark: {
        ...darkBase,
        primary: '#60a5fa',
        accent: '#a78bfa',
        gradientStart: '#60a5fa',
        gradientEnd: '#8b5cf6',
      },
    },
  },
  sunset: {
    label: 'Sunset',
    description: 'Warm amber & rose',
    preview: ['#f97316', '#ec4899'],
    palettes: {
      light: {
        ...lightBase,
        primary: '#f97316',
        accent: '#ec4899',
        gradientStart: '#f97316',
        gradientEnd: '#ec4899',
      },
      dark: {
        ...darkBase,
        primary: '#fb923c',
        accent: '#fb7185',
        gradientStart: '#fb923c',
        gradientEnd: '#f43f5e',
      },
    },
  },
  forest: {
    label: 'Forest',
    description: 'Emerald & teal',
    preview: ['#10b981', '#14b8a6'],
    palettes: {
      light: {
        ...lightBase,
        primary: '#10b981',
        accent: '#14b8a6',
        gradientStart: '#10b981',
        gradientEnd: '#14b8a6',
      },
      dark: {
        ...darkBase,
        primary: '#34d399',
        accent: '#2dd4bf',
        gradientStart: '#22c55e',
        gradientEnd: '#14b8a6',
      },
    },
  },
}

interface AppearanceState {
  mode: ThemeMode
  theme: ThemeId
  systemPrefersDark: boolean
}

export const useAppearanceStore = defineStore('appearance', {
  state: (): AppearanceState => ({
    mode: 'system',
    theme: 'aurora',
    systemPrefersDark: false,
  }),

  getters: {
    effectiveMode(state): 'light' | 'dark' {
      return state.mode === 'system' ? (state.systemPrefersDark ? 'dark' : 'light') : state.mode
    },
    activeTheme(state): ThemeDefinition {
      return themePresets[state.theme] || themePresets.aurora
    },
    activePalette(state): Palette {
      const palette = themePresets[state.theme] || themePresets.aurora
      const mode = state.mode === 'system' ? (state.systemPrefersDark ? 'dark' : 'light') : state.mode
      return palette.palettes[mode]
    },
  },

  actions: {
    init() {
      if (typeof window === 'undefined') return

      this.loadFromStorage()
      this.setupSystemWatcher()
      this.applyTheme()
    },

    loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as Partial<AppearanceState>
        if (parsed.mode === 'light' || parsed.mode === 'dark' || parsed.mode === 'system') {
          this.mode = parsed.mode
        }
        const isThemeId = (value: unknown): value is ThemeId =>
          typeof value === 'string' && value in themePresets

        if (isThemeId(parsed.theme)) {
          this.theme = parsed.theme
        }
      } catch (error) {
        console.warn('Failed to load appearance preferences', error)
      }
    },

    setupSystemWatcher() {
      if (typeof window === 'undefined') return
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      this.systemPrefersDark = mediaQuery.matches
      mediaQuery.addEventListener('change', (event) => {
        this.systemPrefersDark = event.matches
        if (this.mode === 'system') {
          this.applyTheme()
        }
      })
    },

    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode: this.mode,
          theme: this.theme,
        })
      )
    },

    setMode(mode: ThemeMode) {
      this.mode = mode
      this.persist()
      this.applyTheme()
    },

    setTheme(theme: ThemeId) {
      if (!themePresets[theme]) return
      this.theme = theme
      this.persist()
      this.applyTheme()
    },

    applyTheme() {
      if (typeof document === 'undefined') return
      const palette = this.activePalette
      const resolvedMode = this.effectiveMode

      Dark.set(resolvedMode === 'dark')
      const root = document.documentElement
      const body = document.body
      root.dataset.themeMode = resolvedMode
      root.dataset.themeName = this.theme
      root.style.colorScheme = resolvedMode
      body.style.colorScheme = resolvedMode

      const cssVars: Record<string, string> = {
        'app-surface': palette.surface,
        'app-surface-muted': palette.surfaceMuted,
        'app-surface-strong': palette.surfaceStrong,
        'app-neutral-weak': palette.neutralWeak,
        'app-border': palette.border,
        'app-border-strong': palette.borderStrong,
        'app-text-strong': palette.textStrong,
        'app-text': palette.text,
        'app-text-soft': palette.textSoft,
        'app-text-muted': palette.textMuted,
        'app-placeholder': palette.placeholder,
        'app-primary': palette.primary,
        'app-accent': palette.accent,
        'app-gradient-start': palette.gradientStart,
        'app-gradient-end': palette.gradientEnd,
        'app-accent-start': palette.gradientStart,
        'app-accent-end': palette.gradientEnd,
        'app-danger-soft': palette.dangerSoft,
        'app-positive-soft': palette.positiveSoft,
        'app-info-soft': palette.infoSoft,
        'app-overlay': palette.overlay,
        'app-status-online': palette.statusOnline,
        'app-status-dnd': palette.statusDnd,
        'app-status-offline': palette.statusOffline,
        'app-surface-muted-strong': palette.surfaceMutedStrong,
        'app-shadow-soft': palette.shadowSoft,
        'app-shadow-strong': palette.shadowStrong,
        'app-scrollbar-track': palette.scrollbarTrack,
        'app-scrollbar-thumb': palette.scrollbarThumb,
        'app-scrollbar-thumb-hover': palette.scrollbarThumbHover,
      }

      Object.entries(cssVars).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value)
        body.style.setProperty(`--${key}`, value)
      })

      // Update Quasar's runtime color system using setCssVar
      const brandMap: Record<string, string> = {
        primary: palette.primary,
        secondary: palette.accent,
        accent: palette.accent,
        dark: palette.dark,
        positive: palette.positive,
        negative: palette.danger,
        info: palette.info,
        warning: palette.statusDnd,
      }
      Object.entries(brandMap).forEach(([name, value]) => {
        setCssVar(name as any, value, body)
        root.style.setProperty(`--q-${name}`, value)
      })
      body.style.setProperty('--q-dark-page', palette.darkPage)
      root.style.setProperty('--q-dark-page', palette.darkPage)

      document.body.style.backgroundColor = palette.surfaceMuted
      document.body.style.color = palette.text
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAppearanceStore, import.meta.hot))
}
