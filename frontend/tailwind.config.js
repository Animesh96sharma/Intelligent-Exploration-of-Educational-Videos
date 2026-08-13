/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f5f7fb',
        'bg-accent': '#eef3fb',
        surface: {
          DEFAULT: '#ffffff',
          soft: '#f8fafc',
          'soft-2': '#eef2f7',
          muted: '#f4f7fb',
          elevated: 'rgba(255,255,255,0.96)',
        },
        border: {
          DEFAULT: '#d9e2ec',
          strong: '#c5d2e0',
        },
        divider: '#e8eef5',
        text: {
          DEFAULT: '#0f172a',
          soft: '#334155',
          faint: '#64748b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        lg: '18px',
        md: '14px',
        sm: '10px',
        xl: '22px',
        '2xl': '28px',
        '3xl': '30px',
      },
      boxShadow: {
        sm: '0 8px 20px rgba(15,23,42,0.05)',
        md: '0 18px 40px rgba(15,23,42,0.08)',
      },
      backgroundImage: {
        'page-gradient': 'radial-gradient(circle at top left, rgba(37,99,235,0.05), transparent 28%), linear-gradient(180deg, #eef3fb 0%, #f5f7fb 38%, #f8fafc 100%)',
        'hero-blue': 'radial-gradient(circle at 100% 0%, rgba(37,99,235,0.14), transparent 30%), radial-gradient(circle at 0% 100%, rgba(20,184,166,0.1), transparent 26%), linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))',
        'hero-purple': 'radial-gradient(circle at 100% 0%, rgba(124,58,237,0.16), transparent 30%), radial-gradient(circle at 0% 100%, rgba(236,72,153,0.09), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))',
        'hero-network': 'radial-gradient(circle at 100% 0%, rgba(37,99,235,0.14), transparent 30%), radial-gradient(circle at 0% 100%, rgba(168,85,247,0.11), transparent 28%), linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))',
        'hero-amber': 'radial-gradient(circle at 100% 0%, rgba(245,158,11,0.14), transparent 28%), radial-gradient(circle at 0% 100%, rgba(239,68,68,0.09), transparent 26%), linear-gradient(135deg, rgba(255,255,255,0.96), rgba(248,250,252,0.96))',
      },
    },
  },
  plugins: [],
};
