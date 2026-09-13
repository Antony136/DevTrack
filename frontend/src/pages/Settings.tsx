import { useTheme, type ColorScheme, type FontSize, type Theme } from "../context/ThemeContext"
import Icon from "../components/Icon"

function Settings() {
  const { 
    settings, 
    updateTheme, 
    updateFontSize, 
    updateColorScheme,
    updateFontFamily,
    toggleCompactSpacing,
    toggleSmoothAnimations,
    toggleShowSidebar,
  } = useTheme()

  const themes: Array<{ value: Theme; label: string; icon: string }> = [
    { value: "dark", label: "Dark", icon: "moon" },
    { value: "light", label: "Light", icon: "sun" },
  ]

  const fontSizes: Array<{ value: FontSize; label: string }> = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
  ]

  const colorSchemes: Array<{ value: ColorScheme; label: string; color: string }> = [
    { value: "teal", label: "Teal", color: "#2dd4bf" },
    { value: "blue", label: "Blue", color: "#60a5fa" },
    { value: "purple", label: "Purple", color: "#a78bfa" },
    { value: "emerald", label: "Emerald", color: "#10b981" },
  ]

  return (
    <main className="page">
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-content">
            <h1>Settings</h1>
            <p>Customize your DevTrack experience</p>
          </div>
        </div>

        <div className="settings-grid">
          {/* Theme Section */}
          <div className="settings-panel">
            <div className="settings-header">
              <div className="settings-icon">
                <Icon name="palette" />
              </div>
              <div>
                <h3>Theme</h3>
                <p>Choose your preferred color mode</p>
              </div>
            </div>

            <div className="settings-options">
              {themes.map((t) => (
                <button
                  key={t.value}
                  className={`settings-option ${settings.theme === t.value ? "active" : ""}`}
                  onClick={() => updateTheme(t.value)}
                  type="button"
                >
                  <Icon name={t.icon} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Section */}
          <div className="settings-panel">
            <div className="settings-header">
              <div className="settings-icon">
                <Icon name="type" />
              </div>
              <div>
                <h3>Font Size</h3>
                <p>Adjust text size for readability</p>
              </div>
            </div>

            <div className="settings-options">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  className={`settings-option ${settings.fontSize === size.value ? "active" : ""}`}
                  onClick={() => updateFontSize(size.value)}
                  type="button"
                >
                  <span className="font-size-label">{size.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme Section */}
          <div className="settings-panel">
            <div className="settings-header">
              <div className="settings-icon">
                <Icon name="palette" />
              </div>
              <div>
                <h3>Accent Color</h3>
                <p>Select your primary accent color</p>
              </div>
            </div>

            <div className="color-scheme-options">
              {colorSchemes.map((scheme) => (
                <button
                  key={scheme.value}
                  className={`color-scheme-option ${settings.colorScheme === scheme.value ? "active" : ""}`}
                  onClick={() => updateColorScheme(scheme.value)}
                  style={{ "--accent-color": scheme.color } as React.CSSProperties}
                  title={scheme.label}
                  type="button"
                >
                  <div className="color-swatch" />
                  <span>{scheme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display Preferences Section */}
          <div className="settings-panel">
            <div className="settings-header">
              <div className="settings-icon">
                <Icon name="settings" />
              </div>
              <div>
                <h3>Display</h3>
                <p>Additional display options</p>
              </div>
            </div>

            <div className="settings-preferences">
              <label className="preference-item">
                <input 
                  type="checkbox" 
                  checked={settings.compactSpacing}
                  onChange={(e) => toggleCompactSpacing(e.target.checked)}
                />
                <span>Compact Spacing</span>
              </label>
              <label className="preference-item">
                <input 
                  type="checkbox" 
                  checked={settings.smoothAnimations}
                  onChange={(e) => toggleSmoothAnimations(e.target.checked)}
                />
                <span>Smooth Animations</span>
              </label>
              <label className="preference-item">
                <input 
                  type="checkbox" 
                  checked={settings.showSidebar}
                  onChange={(e) => toggleShowSidebar(e.target.checked)}
                />
                <span>Show Sidebar</span>
              </label>
            </div>
          </div>

          {/* Font Family Section */}
          <div className="settings-panel">
            <div className="settings-header">
              <div className="settings-icon">
                <Icon name="type" />
              </div>
              <div>
                <h3>Font Family</h3>
                <p>Choose your preferred typeface</p>
              </div>
            </div>

            <div className="settings-options">
              <button
                className={`settings-option ${settings.fontFamily === "inter" ? "active" : ""}`}
                onClick={() => updateFontFamily("inter")}
                type="button"
              >
                <span>Inter</span>
              </button>
              <button
                className={`settings-option ${settings.fontFamily === "system" ? "active" : ""}`}
                onClick={() => updateFontFamily("system")}
                type="button"
              >
                <span>System</span>
              </button>
              <button
                className={`settings-option ${settings.fontFamily === "mono" ? "active" : ""}`}
                onClick={() => updateFontFamily("mono")}
                type="button"
              >
                <span>Mono</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default Settings
