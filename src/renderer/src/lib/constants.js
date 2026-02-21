export const colors = {
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  borderSubtle: '#1f1f23',
  separator: '#27272a',

  text: {
    primary: '#fafafa',
    secondary: '#e4e4e7',
    tertiary: '#71717a',
    muted: '#52525b',
    ghost: '#3f3f46'
  },

  accent: {
    green: '#34d399',
    greenBg: 'rgba(52,211,153,0.1)',
    greenBorder: 'rgba(52,211,153,0.2)',
    red: '#ef4444',
    redHover: '#dc2626'
  },

  stickman: {
    body: ['#FF6B6B', '#4ECDC4', '#9B59B6', '#F1C40F', '#3498DB', '#E67E22', '#1ABC9C', '#EC407A'],
    hair: ['#E8485C', '#5BC0EB', '#9B5DE5', '#F15BB5', '#FEE440', '#00BBF9', '#00F5D4', '#FF6F61']
  }
}

export function getBpmSpeed(count) {
  if (count === 0) return 1
  if (count <= 2) return 3
  if (count <= 4) return 6
  if (count <= 7) return 9
  return 12
}

export function getBpmLabel(count) {
  if (count === 0) return null
  if (count <= 2) return '~60'
  if (count <= 4) return '~120'
  if (count <= 7) return '~180'
  return '~240'
}
