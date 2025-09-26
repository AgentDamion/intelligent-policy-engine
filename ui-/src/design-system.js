// ui/src/design-system.js
// AICOMPLYR.io Design System Configuration

export const designSystem = {
  brandName: "aicomplyr.io",
  designPhilosophy: "Clean, professional, trust-focused B2B SaaS design with emphasis on compliance and governance",
  
  colorPalette: {
    primary: {
      indigo: "#4B4BFF",
      teal: "#25B7A5",
      darkIndigo: "#1E3A8A",
      darkGreen: "#065F46",
    },
    secondary: {
      lightTeal: "#5EEAD4",
      mint: "#A7F3D0",
      seafoam: "#D1FAE5"
    },
    neutral: {
      white: "#FFFFFF",
      offWhite: "#F9FAFB",
      lightGray: "#F3F4F6",
      mediumGray: "#9CA3AF",
      darkGray: "#374151",
      charcoal: "#1F2937",
      black: "#000000"
    },
    accent: {
      warning: "#F18C25",
      error: "#EF4444",
      success: "#25B7A5",
      info: "#3B82F6"
    },
    gradients: {
      primaryGradient: "linear-gradient(135deg, #4B4BFF 0%, #25B7A5 100%)",
      heroGradient: "linear-gradient(180deg, #1E3A8A 0%, #4B4BFF 50%, #25B7A5 100%)",
      cardHover: "linear-gradient(135deg, rgba(75, 75, 255, 0.08) 0%, rgba(37, 183, 165, 0.08) 100%)"
    }
  },
  
  typography: {
    fontFamilies: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace"
    },
    fontSizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem"
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },
  
  spacing: {
    unit: "rem",
    scale: {
      "0": "0",
      "1": "0.25rem",
      "2": "0.5rem",
      "3": "0.75rem",
      "4": "1rem",
      "5": "1.25rem",
      "6": "1.5rem",
      "8": "2rem",
      "10": "2.5rem",
      "12": "3rem",
      "16": "4rem",
      "20": "5rem",
      "24": "6rem"
    }
  },
  
  components: {
    buttons: {
      primary: {
        background: "#14B8A6",
        color: "#FFFFFF",
        padding: "0.75rem 1.5rem",
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
        fontWeight: 500,
        hover: {
          background: "#0D9488",
          transform: "translateY(-1px)",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
        }
      },
      secondary: {
        background: "transparent",
        color: "#14B8A6",
        border: "1px solid #14B8A6",
        padding: "0.75rem 1.5rem",
        borderRadius: "0.375rem"
      },
      danger: {
        background: "#DC2626",
        color: "#FFFFFF",
        padding: "0.75rem 1.5rem",
        borderRadius: "0.375rem"
      }
    },
    
    cards: {
      default: {
        background: "#FFFFFF",
        borderRadius: "0.75rem",
        padding: "1.5rem",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        border: "1px solid #E5E7EB",
        hover: {
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          transform: "translateY(-2px)"
        }
      },
      featured: {
        background: "linear-gradient(135deg, #F0FDFA 0%, #E6FFFA 100%)",
        border: "1px solid #5EEAD4",
        borderRadius: "1rem",
        padding: "2rem"
      },
      dark: {
        background: "#1F2937",
        color: "#F9FAFB",
        borderRadius: "0.75rem",
        padding: "2rem"
      }
    },
    
    navigation: {
      header: {
        height: "64px",
        background: "#FFFFFF",
        borderBottom: "1px solid #E5E7EB",
        padding: "0 2rem",
        logo: {
          height: "32px"
        },
        links: {
          color: "#374151",
          fontSize: "0.875rem",
          fontWeight: 500,
          hover: {
            color: "#14B8A6"
          }
        }
      },
      footer: {
        background: "#0F172A",
        color: "#9CA3AF",
        padding: "3rem 0 2rem",
        links: {
          color: "#D1D5DB",
          hover: {
            color: "#14B8A6"
          }
        }
      }
    },
    
    badges: {
      default: {
        background: "#F3F4F6",
        color: "#374151",
        padding: "0.25rem 0.75rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 500
      },
      success: {
        background: "#D1FAE5",
        color: "#065F46"
      },
      warning: {
        background: "#FEF3C7",
        color: "#92400E"
      },
      info: {
        background: "#DBEAFE",
        color: "#1E40AF"
      }
    },
    
    forms: {
      input: {
        background: "#FFFFFF",
        border: "1px solid #D1D5DB",
        borderRadius: "0.375rem",
        padding: "0.5rem 0.75rem",
        fontSize: "0.875rem",
        focus: {
          borderColor: "#14B8A6",
          outline: "2px solid transparent",
          outlineOffset: "2px",
          boxShadow: "0 0 0 3px rgba(20, 184, 166, 0.1)"
        }
      },
      label: {
        fontSize: "0.875rem",
        fontWeight: 500,
        color: "#374151",
        marginBottom: "0.5rem"
      }
    },
    
    icons: {
      style: "outline",
      strokeWidth: 1.5,
      size: {
        sm: "16px",
        md: "20px",
        lg: "24px",
        xl: "32px"
      },
      colors: {
        default: "#6B7280",
        primary: "#14B8A6",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444"
      }
    }
  },
  
  layouts: {
    container: {
      maxWidth: "1280px",
      padding: "0 1rem",
      margin: "0 auto"
    },
    section: {
      padding: {
        mobile: "3rem 0",
        desktop: "5rem 0"
      }
    },
    grid: {
      columns: {
        mobile: 1,
        tablet: 2,
        desktop: 3,
        wide: 4
      },
      gap: "1.5rem"
    }
  },
  
  animations: {
    transitions: {
      fast: "150ms ease-in-out",
      base: "200ms ease-in-out",
      slow: "300ms ease-in-out"
    },
    hover: {
      lift: "translateY(-2px)",
      scale: "scale(1.02)",
      brightness: "brightness(0.95)"
    }
  },
  
  patterns: {
    heroSections: {
      style: "centered-content-with-graphic",
      background: "gradient-overlay",
      contentAlignment: "center",
      imagery: "abstract-illustrations-or-product-screenshots"
    },
    featureSections: {
      layout: "grid-cards",
      iconPosition: "top",
      cardStyle: "bordered-with-hover"
    },
    ctaSections: {
      style: "centered-with-dual-buttons",
      background: "subtle-gradient",
      padding: "generous"
    },
    testimonials: {
      style: "card-based",
      layout: "horizontal-scroll-or-grid",
      quoteStyle: "large-quote-marks"
    }
  },
  
  responsive: {
    breakpoints: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px"
    },
    scaling: {
      typography: "fluid",
      spacing: "proportional",
      components: "adaptive"
    }
  },
  
  specialElements: {
    dashboardWidgets: {
      background: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: "0.75rem",
      headerBackground: "#F9FAFB",
      padding: "1rem"
    },
    statusIndicators: {
      success: {
        color: "#10B981",
        icon: "check-circle"
      },
      warning: {
        color: "#F59E0B",
        icon: "exclamation-triangle"
      },
      error: {
        color: "#EF4444",
        icon: "x-circle"
      },
      info: {
        color: "#3B82F6",
        icon: "information-circle"
      }
    },
    progressBars: {
      height: "8px",
      background: "#E5E7EB",
      fillColor: "#14B8A6",
      borderRadius: "4px"
    }
  }
};

// Utility functions for easy access
export const getColor = (path) => {
  const keys = path.split('.');
  let value = designSystem.colorPalette;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getTypography = (path) => {
  const keys = path.split('.');
  let value = designSystem.typography;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getComponent = (path) => {
  const keys = path.split('.');
  let value = designSystem.components;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export default designSystem; 