/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // 色彩系统 (OKLCH-based)
      colors: {
        // 中性色
        'ink': 'oklch(15% 0.05 280)',
        'ink-soft': 'oklch(45% 0.08 280)',
        'ink-faint': 'oklch(65% 0.06 280)',
        'surface': 'oklch(99% 0.001 0)',
        'bg': 'oklch(95% 0.01 280)',
        'border': 'oklch(87% 0.02 280)',

        // 5 个发展域颜色
        'domain-gross': 'oklch(65% 0.25 142)',      // 粗动作 - 绿
        'domain-gross-light': 'oklch(92% 0.06 142)',
        'domain-fine': 'oklch(55% 0.22 260)',       // 精细动作 - 蓝
        'domain-fine-light': 'oklch(91% 0.05 260)',
        'domain-language': 'oklch(65% 0.20 85)',    // 语言 - 金
        'domain-language-light': 'oklch(93% 0.04 85)',
        'domain-cognitive': 'oklch(60% 0.15 310)',  // 认知 - 紫
        'domain-cognitive-light': 'oklch(92% 0.04 310)',
        'domain-social': 'oklch(60% 0.20 200)',     // 社交 - 青
        'domain-social-light': 'oklch(91% 0.05 200)',

        // 状态色
        'retro': 'oklch(70% 0.15 20)',              // 补填 - 暖桃
        'retro-light': 'oklch(93% 0.03 20)',
        'piaget': 'oklch(58% 0.15 250)',            // 皮亚杰 - 靛蓝
        'piaget-light': 'oklch(92% 0.04 250)',
      },

      // 排版系统
      fontFamily: {
        'display': ['Noto Serif TC', 'Georgia', 'serif'],
        'body': ['Noto Sans TC', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        'mono': ['Fira Code', 'Menlo', 'monospace'],
      },

      fontSize: {
        'xs': ['11px', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        'sm': ['13px', { lineHeight: '1.5' }],
        'base': ['15px', { lineHeight: '1.6' }],
        'lg': ['17px', { lineHeight: '1.6' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
        '3xl': ['32px', { lineHeight: '1.3', fontWeight: '700' }],
        '4xl': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
      },

      // 间距系统 (4pt scale)
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px',
        '4xl': '64px',
        '5xl': '96px',
      },

      // 圆角
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        'full': '9999px',
      },

      // 阴影
      boxShadow: {
        'xs': '0 1px 2px rgba(0,0,0,0.04)',
        'sm': '0 2px 6px rgba(0,0,0,0.06)',
        'md': '0 4px 12px rgba(0,0,0,0.08)',
        'lg': '0 8px 24px rgba(0,0,0,0.10)',
        'xl': '0 16px 40px rgba(0,0,0,0.12)',
      },

      // 最大宽度
      maxWidth: {
        'form': '440px',
        'sm': '28rem',
        'md': '32rem',
        'lg': '40rem',
        'xl': '56rem',
        '2xl': '64rem',
      },

      // 动画
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fadeUp': 'fadeUp 0.4s ease both',
        'fadeIn': 'fadeIn 0.3s ease',
        'slideDown': 'slideDown 0.2s ease',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
