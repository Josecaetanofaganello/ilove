/* ============================================================
   THEMES.JS — Definições de Temas por Ocasião
   ============================================================ */

const THEMES = {
  valentine: {
    id: 'valentine',
    name: 'Dia dos Namorados',
    nameShort: 'Namorados',
    icon: '💕',
    icons: ['💕', '❤️', '💋', '🌹', '💝'],
    primary: '#D4296B',
    primaryRgb: '212, 41, 107',
    secondary: '#FF6B9D',
    accent: '#FFD700',
    accentRgb: '255, 215, 0',
    bgDark: '#0D0208',
    bgMedium: '#1A0512',
    bgLight: '#2D0820',
    textLight: '#FFF5F8',
    particleType: 'heart',
    particleColor: '#FF6B9D',
    particleColor2: '#FF1744',
    fontDisplay: "'Playfair Display', serif",
    gradient: 'linear-gradient(135deg, #0D0208 0%, #1A0512 40%, #2D0820 100%)',
    gradientVibrant: 'linear-gradient(135deg, #D4296B, #FF6B9D, #FFD700)',
    sceneTransition: 'fade-love',
    openingText: 'Uma Declaração de Amor',
    openingEmoji: '💕',
    closingEmoji: '❤️',
    shimmerColors: ['#D4296B', '#FF6B9D', '#FFD700', '#FF8FA3'],
  },
  mothers: {
    id: 'mothers',
    name: 'Dia das Mães',
    nameShort: 'Mães',
    icon: '🌸',
    icons: ['🌸', '🌺', '💐', '🌷', '🌼'],
    primary: '#B565CC',
    primaryRgb: '181, 101, 204',
    secondary: '#E896F5',
    accent: '#FFEAA7',
    accentRgb: '255, 234, 167',
    bgDark: '#0C0410',
    bgMedium: '#1A0A1F',
    bgLight: '#250F2E',
    textLight: '#FDF5FF',
    particleType: 'flower',
    particleColor: '#E896F5',
    particleColor2: '#FFEAA7',
    fontDisplay: "'Cormorant Garamond', serif",
    gradient: 'linear-gradient(135deg, #0C0410 0%, #1A0A1F 40%, #250F2E 100%)',
    gradientVibrant: 'linear-gradient(135deg, #B565CC, #E896F5, #FFEAA7)',
    sceneTransition: 'bloom',
    openingText: 'Uma Homenagem à Mulher da Minha Vida',
    openingEmoji: '🌸',
    closingEmoji: '💐',
    shimmerColors: ['#B565CC', '#E896F5', '#FFEAA7', '#F8A9FF'],
  },
  fathers: {
    id: 'fathers',
    name: 'Dia dos Pais',
    nameShort: 'Pais',
    icon: '⭐',
    icons: ['⭐', '🏆', '💪', '🎯', '🌟'],
    primary: '#2E86C1',
    primaryRgb: '46, 134, 193',
    secondary: '#5DADE2',
    accent: '#D4A853',
    accentRgb: '212, 168, 83',
    bgDark: '#040A14',
    bgMedium: '#071525',
    bgLight: '#0D2340',
    textLight: '#F0F8FF',
    particleType: 'star',
    particleColor: '#5DADE2',
    particleColor2: '#D4A853',
    fontDisplay: "'Raleway', sans-serif",
    gradient: 'linear-gradient(135deg, #040A14 0%, #071525 40%, #0D2340 100%)',
    gradientVibrant: 'linear-gradient(135deg, #2E86C1, #5DADE2, #D4A853)',
    sceneTransition: 'rise',
    openingText: 'Para o Maior Herói da Minha Vida',
    openingEmoji: '⭐',
    closingEmoji: '🏆',
    shimmerColors: ['#2E86C1', '#5DADE2', '#D4A853', '#85C1E9'],
  },
  birthday: {
    id: 'birthday',
    name: 'Aniversário',
    nameShort: 'Aniversário',
    icon: '🎂',
    icons: ['🎂', '🎉', '🎊', '🥳', '🎈'],
    primary: '#7D3C98',
    primaryRgb: '125, 60, 152',
    secondary: '#AF7AC5',
    accent: '#F1C40F',
    accentRgb: '241, 196, 15',
    bgDark: '#08040E',
    bgMedium: '#120820',
    bgLight: '#1E0D35',
    textLight: '#FAF5FF',
    particleType: 'confetti',
    particleColor: '#AF7AC5',
    particleColor2: '#F1C40F',
    fontDisplay: "'Cinzel', serif",
    gradient: 'linear-gradient(135deg, #08040E 0%, #120820 40%, #1E0D35 100%)',
    gradientVibrant: 'linear-gradient(135deg, #7D3C98, #AF7AC5, #F1C40F)',
    sceneTransition: 'burst',
    openingText: 'Feliz Aniversário!',
    openingEmoji: '🎂',
    closingEmoji: '🎉',
    shimmerColors: ['#7D3C98', '#AF7AC5', '#F1C40F', '#C39BD3'],
  },
  custom: {
    id: 'custom',
    name: 'Personalizado',
    nameShort: 'Especial',
    icon: '✨',
    icons: ['✨', '🌟', '💫', '⚡', '🔮'],
    primary: '#5C4AE4',
    primaryRgb: '92, 74, 228',
    secondary: '#8B7CF8',
    accent: '#FFD166',
    accentRgb: '255, 209, 102',
    bgDark: '#060610',
    bgMedium: '#0E0E28',
    bgLight: '#151540',
    textLight: '#F5F4FF',
    particleType: 'sparkle',
    particleColor: '#8B7CF8',
    particleColor2: '#FFD166',
    fontDisplay: "'Inter', sans-serif",
    gradient: 'linear-gradient(135deg, #060610 0%, #0E0E28 40%, #151540 100%)',
    gradientVibrant: 'linear-gradient(135deg, #5C4AE4, #8B7CF8, #FFD166)',
    sceneTransition: 'fade',
    openingText: 'Um Momento Especial',
    openingEmoji: '✨',
    closingEmoji: '💫',
    shimmerColors: ['#5C4AE4', '#8B7CF8', '#FFD166', '#A89AFF'],
  }
};

/**
 * Apply a theme to the document by setting CSS variables
 */
function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.valentine;
  const root = document.documentElement;

  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-rgb', theme.primaryRgb);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-rgb', theme.accentRgb);
  root.style.setProperty('--bg-dark', theme.bgDark);
  root.style.setProperty('--bg-medium', theme.bgMedium);
  root.style.setProperty('--bg-light', theme.bgLight);
  root.style.setProperty('--text-light', theme.textLight);
  root.style.setProperty('--particle-color', theme.particleColor);
  root.style.setProperty('--font-display', theme.fontDisplay);
  root.style.setProperty('--theme-gradient', theme.gradient);

  document.body.className = `theme-${themeId}`;
  document.body.style.background = theme.bgDark;

  return theme;
}

/**
 * Get theme by ID
 */
function getTheme(themeId) {
  return THEMES[themeId] || THEMES.valentine;
}
