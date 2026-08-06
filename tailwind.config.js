/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        /* GuitarraIA custom tokens — light premium theme */
        'g-page': '#F8F9FB',
        'g-sidebar': '#FFFFFF',
        'g-surface': '#FFFFFF',
        'g-card': '#FFFFFF',
        'g-card-el': '#F3F4F6',
        'g-input': '#FFFFFF',
        'g-border': '#E5E7EB',
        'g-border-sub': '#E5E7EB',
        'g-border-str': '#D1D5DB',
        'g-text': '#1F2937',
        'g-text-2': '#6B7280',
        'g-text-m': '#9CA3AF',
        'orange': '#F97316',
        'orange-h': '#FB923C',
        'orange-p': '#EA580C',
        'easy': '#4C9A2A',
        'mid': '#B7791F',
        'hard': '#C2410C',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      fontFamily: {
        heading: ['"Faculty Glyphic"', 'Georgia', 'serif'],
        body: ['"Faculty Glyphic"', 'Georgia', 'serif'],
        display: ['"Faculty Glyphic"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': ['44px', { lineHeight: '1.1', fontWeight: '700' }],
        'h1': ['36px', { lineHeight: '1.2', fontWeight: '700' }],
        'h2': ['28px', { lineHeight: '1.25', fontWeight: '700' }],
        'h3': ['22px', { lineHeight: '1.3', fontWeight: '650' }],
        'h4': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.65' }],
        'body-sm': ['14px', { lineHeight: '1.6' }],
        'caption': ['12px', { lineHeight: '1.5', fontWeight: '500' }],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
      boxShadow: {
        'card': '0 8px 24px rgba(0,0,0,0.22)',
        'modal': '0 20px 60px rgba(0,0,0,0.45)',
        'sticky': '0 -8px 30px rgba(0,0,0,0.30)',
        'orange-glow': '0 0 20px rgba(255,114,0,0.25)',
      }
    }
  },
  plugins: [],
}
