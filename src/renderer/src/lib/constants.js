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
    fire: '#FB923C',
    fireBg: 'rgba(251,146,60,0.1)',
    fireBorder: 'rgba(251,146,60,0.2)',
    ember: '#F59E0B',
    gold: '#FBBF24',
    red: '#ef4444',
    redHover: '#dc2626'
  },

  scene: {
    ground: '#292017',
    logBrown: '#5C3D1E',
    flame1: '#FF6B00',
    flame2: '#FFB800',
    flame3: '#FFF4CC',
    spark: '#FFD700'
  }
}

export function getCampSpeed(count) {
  if (count === 0) return 1
  if (count <= 2) return 1.5
  if (count <= 4) return 2
  if (count <= 7) return 2.5
  return 3
}

export function getCampState(count) {
  if (count === 0) return null
  if (count <= 2) return 'Quiet Camp'
  if (count <= 4) return 'Active Camp'
  if (count <= 7) return 'Busy Camp'
  return 'Festival'
}
