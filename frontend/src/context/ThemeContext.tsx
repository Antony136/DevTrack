import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Theme = "dark" | "light"
export type FontSize = "small" | "medium" | "large"
export type ColorScheme = "teal" | "blue" | "purple" | "emerald"

interface ThemeSettings {
  theme: Theme
  fontSize: FontSize
  colorScheme: ColorScheme
  fontFamily: "inter" | "system" | "mono"
  compactSpacing: boolean
  smoothAnimations: boolean
  showSidebar: boolean
}

interface ThemeContextType {
  settings: ThemeSettings
  updateTheme: (theme: Theme) => void
  updateFontSize: (size: FontSize) => void
  updateColorScheme: (scheme: ColorScheme) => void
  updateFontFamily: (fontFamily: "inter" | "system" | "mono") => void
  toggleCompactSpacing: (value: boolean) => void
  toggleSmoothAnimations: (value: boolean) => void
  toggleShowSidebar: (value: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const DEFAULT_SETTINGS: ThemeSettings = {
  theme: "dark",
  fontSize: "medium",
  colorScheme: "teal",
  fontFamily: "inter",
  compactSpacing: false,
  smoothAnimations: true,
  showSidebar: true,
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS)

  // Load settings from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("devtrack:theme-settings")
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch {
        setSettings(DEFAULT_SETTINGS)
      }
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    // Update data attributes
    root.setAttribute("data-theme", settings.theme)
    root.setAttribute("data-font-size", settings.fontSize)
    root.setAttribute("data-color-scheme", settings.colorScheme)
    root.setAttribute("data-font-family", settings.fontFamily)
    root.setAttribute("data-compact", settings.compactSpacing ? "true" : "false")
    root.setAttribute("data-animations", settings.smoothAnimations ? "true" : "false")
    root.setAttribute("data-sidebar", settings.showSidebar ? "true" : "false")
    
    // Save to sessionStorage
    sessionStorage.setItem("devtrack:theme-settings", JSON.stringify(settings))
  }, [settings])

  const updateTheme = (theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }))
  }

  const updateFontSize = (fontSize: FontSize) => {
    setSettings((prev) => ({ ...prev, fontSize }))
  }

  const updateColorScheme = (colorScheme: ColorScheme) => {
    setSettings((prev) => ({ ...prev, colorScheme }))
  }

  const updateFontFamily = (fontFamily: "inter" | "system" | "mono") => {
    setSettings((prev) => ({ ...prev, fontFamily }))
  }

  const toggleCompactSpacing = (value: boolean) => {
    setSettings((prev) => ({ ...prev, compactSpacing: value }))
  }

  const toggleSmoothAnimations = (value: boolean) => {
    setSettings((prev) => ({ ...prev, smoothAnimations: value }))
  }

  const toggleShowSidebar = (value: boolean) => {
    setSettings((prev) => ({ ...prev, showSidebar: value }))
  }

  return (
    <ThemeContext.Provider
      value={{
        settings,
        updateTheme,
        updateFontSize,
        updateColorScheme,
        updateFontFamily,
        toggleCompactSpacing,
        toggleSmoothAnimations,
        toggleShowSidebar,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
