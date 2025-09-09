/**
 * Theme Manager - Handles Adobe application theme integration
 */

const themeManager = {
    csInterface: null,
    
    init() {
        this.csInterface = new CSInterface();
        this.updateTheme();
        
        // Listen for theme change events
        this.csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, () => {
            this.updateTheme();
        });
    },
    
    updateTheme() {
        const hostEnv = this.csInterface.getHostEnvironment();
        const bgColor = hostEnv.appSkinInfo.panelBackgroundColor.color;
        
        // Convert to RGB
        const bg = this.toRGB(bgColor);
        
        // Determine if dark or light theme
        const isDark = (bg.r + bg.g + bg.b) / 3 < 128;
        
        // Update CSS variables
        const root = document.documentElement;
        
        if (isDark) {
            root.style.setProperty('--bg-primary', '#1e1e1e');
            root.style.setProperty('--bg-secondary', '#252525');
            root.style.setProperty('--bg-tertiary', '#2d2d2d');
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#b0b0b0');
            root.style.setProperty('--border-color', '#3a3a3a');
        } else {
            root.style.setProperty('--bg-primary', '#f5f5f5');
            root.style.setProperty('--bg-secondary', '#ffffff');
            root.style.setProperty('--bg-tertiary', '#e8e8e8');
            root.style.setProperty('--text-primary', '#000000');
            root.style.setProperty('--text-secondary', '#666666');
            root.style.setProperty('--border-color', '#d0d0d0');
        }
        
        // Add theme class to body
        document.body.classList.toggle('dark-theme', isDark);
        document.body.classList.toggle('light-theme', !isDark);
    },
    
    toRGB(color) {
        return {
            r: Math.round(color.red),
            g: Math.round(color.green),
            b: Math.round(color.blue)
        };
    }
};