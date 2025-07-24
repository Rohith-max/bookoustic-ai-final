import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    fontFamily: {
      sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
    },
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: '#e5e7eb',
        input: '#e5e7eb',
        ring: '#3b82f6',
        background: {
          DEFAULT: '#f6f8fc',
          secondary: '#f3f6fb',
        },
        foreground: '#1e293b',
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          glow: '#60a5fa',
          foreground: '#fff',
        },
        accent: {
          DEFAULT: '#2563eb',
        },
        secondary: {
          DEFAULT: '#f3f6fb',
          foreground: '#1e293b',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#fff',
        },
        muted: {
          DEFAULT: '#94a3b8',
          foreground: '#64748b',
        },
        card: {
          DEFAULT: '#fff',
          foreground: '#1e293b',
          elevated: '#f3f6fb',
        },
        popover: {
          DEFAULT: '#fff',
          foreground: '#1e293b',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #3b82f6, #60a5fa)',
        'gradient-background': 'linear-gradient(135deg, #f6f8fc 0%, #f3f6fb 100%)',
        'gradient-card': 'linear-gradient(135deg, #fff 0%, #f3f6fb 100%)',
      },
      boxShadow: {
        'glow': '0 0 30px #3b82f626',
        'card': '0 4px 20px #1e293b14',
        'elegant': '0 10px 40px -10px #3b82f633',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      borderRadius: {
        lg: '16px',
        md: '14px',
        sm: '12px',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
