export const brand = {
  name: 'Shakes Pear',
  display: 'S H A K E S  P E A R',
};

export const colors = {
  parchment: '#F5EDCC',
  parchmentDark: '#D4C49A',
  ink: '#1A0E05',
  inkMuted: '#4A3728',
  burgundy: '#7B1C2E',
  burgundyLight: '#9B2C3E',
  gold: '#C4A882',
  goldAccent: '#C9A84C',
  brown: '#7A6550',
  green: '#1E3A2F',
  greenLight: '#2D5040',
  overlay: 'rgba(26,14,5,0.72)',
  goldBorder: 'rgba(196,168,130,0.4)',
  goldBg: 'rgba(196,168,130,0.18)',
  goldBgLight: 'rgba(196,168,130,0.15)',
  goldBorderLight: 'rgba(196,168,130,0.22)',
  progressTrack: 'rgba(196,168,130,0.25)',
};

export const fonts = {
  cinzel: 'Cinzel_600SemiBold',
  cinzelRegular: 'Cinzel_400Regular',
  cinzelBold: 'Cinzel_700Bold',
  fell: 'IMFellEnglish_400Regular_Italic',
  lora: 'Lora_400Regular',
  loraMedium: 'Lora_500Medium',
  loraItalic: 'Lora_400Regular_Italic',
};

export const spacing = {
  screenPadding: 20,
  bottomNavHeight: 72,
};

export const testIds = {
  screen: {
    library: 'screen-library',
    search: 'screen-search',
    import: 'screen-import',
    settings: 'screen-settings',
    detail: 'screen-detail',
    player: 'screen-player',
    processing: 'screen-processing',
  },
  nav: {
    library: 'nav-library',
    search: 'nav-search',
    import: 'nav-import',
    settings: 'nav-settings',
  },
  library: {
    continueReading: 'library-continue-reading',
    bookCard: (id: string) => `library-book-${id}`,
  },
  detail: {
    back: 'detail-back',
    resume: 'detail-resume',
    chapter: (id: number) => `detail-chapter-${id}`,
  },
  player: {
    back: 'player-back',
    playPause: 'player-play-pause',
    summary: 'player-summary',
    speed: (speed: number) => `player-speed-${speed}`,
  },
  search: {
    input: 'search-input',
    result: (id: string) => `search-result-${id}`,
    genre: (name: string) => `search-genre-${name.toLowerCase()}`,
  },
  import: {
    back: 'import-back',
    tab: (format: string) => `import-tab-${format}`,
    dropZone: 'import-drop-zone',
  },
  summary: {
    modal: 'summary-modal',
    close: 'summary-close',
    markHeard: 'summary-mark-heard',
    retry: 'summary-retry',
  },
  settings: {
    speed: (speed: number) => `settings-speed-${speed}`,
    voice: (name: string) => `settings-voice-${name.replace(/\s/g, '-').toLowerCase()}`,
    sleepDecrease: 'settings-sleep-decrease',
    sleepIncrease: 'settings-sleep-increase',
  },
};
