import { create } from 'zustand';

export interface UISettings {
  // Font settings
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  fontFamily: 'system' | 'inter' | 'roboto' | 'opensans';
  
  // Color settings
  primaryColor: string;
  accentColor: string;
  
  // Theme
  darkMode: boolean;
  
  // Layout
  sidebarCollapsed: boolean;
  compactMode: boolean;
  
  // Chat specific
  chatBubbleStyle: 'modern' | 'classic' | 'minimal';
  showTimestamps: boolean;
  
  // Accessibility
  reduceMotion: boolean;
  highContrast: boolean;
}

interface UISettingsState extends UISettings {
  setFontSize: (size: UISettings['fontSize']) => void;
  setFontFamily: (family: UISettings['fontFamily']) => void;
  setPrimaryColor: (color: string) => void;
  setAccentColor: (color: string) => void;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  setChatBubbleStyle: (style: UISettings['chatBubbleStyle']) => void;
  setShowTimestamps: (show: boolean) => void;
  setReduceMotion: (reduce: boolean) => void;
  setHighContrast: (high: boolean) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: UISettings = {
  fontSize: 'medium',
  fontFamily: 'system',
  primaryColor: '#6366f1', // Indigo
  accentColor: '#8b5cf6', // Purple
  darkMode: false,
  sidebarCollapsed: false,
  compactMode: false,
  chatBubbleStyle: 'modern',
  showTimestamps: true,
  reduceMotion: false,
  highContrast: false,
};

// Font size mappings
export const FONT_SIZE_MAP = {
  small: '14px',
  medium: '16px',
  large: '18px',
  xlarge: '20px',
};

// Font family mappings
export const FONT_FAMILY_MAP = {
  system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  inter: '"Inter", sans-serif',
  roboto: '"Roboto", sans-serif',
  opensans: '"Open Sans", sans-serif',
};

// Preset colors
export const COLOR_PRESETS = {
  primary: [
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Teal', value: '#14b8a6' },
  ],
  accent: [
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Lime', value: '#84cc16' },
    { name: 'Rose', value: '#f43f5e' },
  ],
};

// Load settings from localStorage
const loadSettings = (): UISettings => {
  try {
    const saved = localStorage.getItem('uiSettings');
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load UI settings:', e);
  }
  return DEFAULT_SETTINGS;
};

// Save settings to localStorage
const saveSettings = (settings: UISettings) => {
  try {
    localStorage.setItem('uiSettings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save UI settings:', e);
  }
};

// Apply settings to DOM
const applySettings = (settings: UISettings) => {
  const root = document.documentElement;
  
  // Font size
  root.style.setProperty('--base-font-size', FONT_SIZE_MAP[settings.fontSize]);
  document.body.style.fontSize = FONT_SIZE_MAP[settings.fontSize];
  
  // Font family
  root.style.setProperty('--font-family', FONT_FAMILY_MAP[settings.fontFamily]);
  document.body.style.fontFamily = FONT_FAMILY_MAP[settings.fontFamily];
  
  // Colors
  root.style.setProperty('--primary-color', settings.primaryColor);
  root.style.setProperty('--accent-color', settings.accentColor);
  
  // Dark mode
  if (settings.darkMode) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Reduce motion
  if (settings.reduceMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
  
  // High contrast
  if (settings.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  // Compact mode
  if (settings.compactMode) {
    root.classList.add('compact');
  } else {
    root.classList.remove('compact');
  }
};

export const useUISettingsStore = create<UISettingsState>((set, get) => {
  const initialSettings = loadSettings();
  
  // Apply settings on load
  setTimeout(() => applySettings(initialSettings), 0);
  
  return {
    ...initialSettings,
    
    setFontSize: (fontSize) => {
      const newSettings = { ...get(), fontSize };
      saveSettings(newSettings);
      applySettings(newSettings);
      set({ fontSize });
    },
    
    setFontFamily: (fontFamily) => {
      const newSettings = { ...get(), fontFamily };
      saveSettings(newSettings);
      applySettings(newSettings);
      set({ fontFamily });
    },
    
    setPrimaryColor: (primaryColor) => {
      const newSettings = { ...get(), primaryColor };
      saveSettings(newSettings);
      applySettings(newSettings);
      set({ primaryColor });
    },
    
    setAccentColor: (accentColor) => {
      const newSettings = { ...get(), accentColor };
      saveSettings(newSettings);
      applySettings(newSettings);
      set({ accentColor });
    },
    
    setDarkMode: (darkMode) => {
      const newSettings = { ...get(), darkMode };
      saveSettings(newSettings);
      applySettings(newSettings);
      set({ darkMode });
    },
    
    toggleDarkMode: () => {
      const darkMode = !get().darkMode;
      const newSettings = { ...get(), darkMode };
      saveSettings(newSettings);
      applySettings(newSettings);
      set({ darkMode });
    },
    
    setSidebarCollapsed: (sidebarCollapsed) => {
      const newSettings = { ...get(), sidebarCollapsed };
      saveSettings(newSettings);
      set({ sidebarCollapsed });
    },
    
    setCompactMode: (compactMode) => {
      const newSettings = { ...get(), compactMode };
      saveSettings(newSettings);
      applySettings(newSettings);
      set({ compactMode });
    },
    
    setChatBubbleStyle: (chatBubbleStyle) => {
      const newSettings = { ...get(), chatBubbleStyle };
      saveSettings(newSettings);
      set({ chatBubbleStyle });
    },
    
    setShowTimestamps: (showTimestamps) => {
      const newSettings = { ...get(), showTimestamps };
      saveSettings(newSettings);
      set({ showTimestamps });
    },
    
    setReduceMotion: (reduceMotion) => {
      const newSettings = { ...get(), reduceMotion };
      saveSettings(newSettings);
      applySettings(newSettings);
      set({ reduceMotion });
    },
    
    setHighContrast: (highContrast) => {
      const newSettings = { ...get(), highContrast };
      saveSettings(newSettings);
      applySettings(newSettings);
      set({ highContrast });
    },
    
    resetToDefaults: () => {
      saveSettings(DEFAULT_SETTINGS);
      applySettings(DEFAULT_SETTINGS);
      set(DEFAULT_SETTINGS);
    },
  };
});
