// ─── Aureate Executive — Material Design 3 Color System ────────
//  SV Gold B2B Platform | Brass Gold × Alabaster White
// ──────────────────────────────────────────────────────────────

// ── Surface Scale ─────────────────────────────────────────────
export const SURFACE = '#FCF9F8';
export const SURFACE_DIM = '#DCD9D9';
export const SURFACE_BRIGHT = '#FCF9F8';
export const SURFACE_CONTAINER_LOWEST = '#FFFFFF';
export const SURFACE_CONTAINER_LOW = '#F6F3F2';
export const SURFACE_CONTAINER = '#F0EDED';
export const SURFACE_CONTAINER_HIGH = '#EAE7E7';
export const SURFACE_CONTAINER_HIGHEST = '#E5E2E1';
export const SURFACE_VARIANT = '#E5E2E1';
export const SURFACE_TINT = '#765A13';

// ── On-Surface ────────────────────────────────────────────────
export const ON_SURFACE = '#1C1B1B';
export const ON_SURFACE_VARIANT = '#4D4638';
export const INVERSE_SURFACE = '#313030';
export const INVERSE_ON_SURFACE = '#F3F0EF';

// ── Outline ───────────────────────────────────────────────────
export const OUTLINE = '#7F7666';
export const OUTLINE_VARIANT = '#D0C5B3';

// ── Primary — Brass Gold ──────────────────────────────────────
export const PRIMARY = '#765A13';
export const ON_PRIMARY = '#FFFFFF';
export const PRIMARY_CONTAINER = '#B29146';
export const ON_PRIMARY_CONTAINER = '#3C2B00';
export const INVERSE_PRIMARY = '#E7C271';
export const PRIMARY_FIXED = '#FFDF9D';
export const PRIMARY_FIXED_DIM = '#E7C271';
export const ON_PRIMARY_FIXED = '#251A00';
export const ON_PRIMARY_FIXED_VARIANT = '#5B4300';

// ── Secondary ─────────────────────────────────────────────────
export const SECONDARY = '#5E5F5D';
export const ON_SECONDARY = '#FFFFFF';
export const SECONDARY_CONTAINER = '#E0E0DD';
export const ON_SECONDARY_CONTAINER = '#626361';

// ── Tertiary ──────────────────────────────────────────────────
export const TERTIARY = '#5D5F5F';
export const ON_TERTIARY = '#FFFFFF';
export const TERTIARY_CONTAINER = '#949595';
export const ON_TERTIARY_CONTAINER = '#2C2E2E';

// ── Error ─────────────────────────────────────────────────────
export const ERROR = '#BA1A1A';
export const ON_ERROR = '#FFFFFF';
export const ERROR_CONTAINER = '#FFDAD6';
export const ON_ERROR_CONTAINER = '#93000A';

// ── Background ────────────────────────────────────────────────
export const BACKGROUND = '#FCF9F8';
export const ON_BACKGROUND = '#1C1B1B';

// ──────────────────────────────────────────────────────────────
//  LEGACY ALIASES — keeps every existing screen working
// ──────────────────────────────────────────────────────────────
export const GOLD = PRIMARY_CONTAINER;   // #B29146 Brass Gold
export const GOLD_LIGHT = INVERSE_PRIMARY;     // #E7C271 Champagne
export const GOLD_DARK = PRIMARY;             // #765A13 Deep Bronze

export const IVORY = BACKGROUND;
export const IVORY_LIGHT = SURFACE_CONTAINER_LOWEST;

// NAVY aliases → cream surfaces (light theme)
export const NAVY = BACKGROUND;                // #FCF9F8 Alabaster
export const NAVY_MID = SURFACE_CONTAINER_LOWEST;  // #FFFFFF
export const NAVY_CARD = SURFACE_CONTAINER_LOW;     // #F6F3F2
export const NAVY_INPUT = SURFACE_CONTAINER_LOWEST;  // #FFFFFF
export const NAVY_BORDER = OUTLINE_VARIANT;            // #D0C5B3

// ──────────────────────────────────────────────────────────────
//  B2B TOKEN MAP
// ──────────────────────────────────────────────────────────────
export const B2B = {
    // Brand Gold
    PRIMARY: PRIMARY_CONTAINER,
    PRIMARY_LIGHT: INVERSE_PRIMARY,
    PRIMARY_DARK: PRIMARY,
    GOLD, GOLD_LIGHT, GOLD_DARK,

    // Backgrounds
    BACKGROUND,
    SURFACE,
    CARD_BG: SURFACE_CONTAINER_LOWEST,
    INPUT_BG: SURFACE_CONTAINER_LOWEST,
    SURFACE_CARD: SURFACE_CONTAINER_LOW,

    // Surface scale
    SURFACE_CONTAINER_LOWEST,
    SURFACE_CONTAINER_LOW,
    SURFACE_CONTAINER,
    SURFACE_CONTAINER_HIGH,
    SURFACE_CONTAINER_HIGHEST,
    SURFACE_VARIANT,

    // On-surface
    ON_SURFACE,
    ON_SURFACE_VARIANT,

    // Legacy aliases
    NAVY, NAVY_MID, NAVY_CARD, NAVY_INPUT, NAVY_BORDER,
    IVORY, IVORY_LIGHT,

    // Typography
    TEXT_PRIMARY: ON_SURFACE,
    TEXT_MUTED: ON_SURFACE_VARIANT,

    // Outline
    BORDER: OUTLINE_VARIANT,
    OUTLINE,
    OUTLINE_VARIANT,

    // Overlays
    GOLD_BORDER: 'rgba(178,145,70,0.30)',
    GOLD_DIM: 'rgba(178,145,70,0.08)',

    // Error
    ERROR, ON_ERROR, ERROR_CONTAINER,

    // Secondary / Tertiary
    SECONDARY, SECONDARY_CONTAINER,
    TERTIARY, TERTIARY_CONTAINER,
};

// ──────────────────────────────────────────────────────────────
//  COLORS MAP
// ──────────────────────────────────────────────────────────────
export const Colors = {
    light: {
        text: ON_SURFACE,
        textMuted: ON_SURFACE_VARIANT,
        background: BACKGROUND,
        tint: PRIMARY_CONTAINER,
        tabIconDefault: SECONDARY,
        tabIconSelected: PRIMARY_CONTAINER,
        primary: PRIMARY_CONTAINER,
        primaryDark: PRIMARY,
        secondary: SECONDARY_CONTAINER,
        accent: INVERSE_PRIMARY,
        border: OUTLINE_VARIANT,
        inputBg: SURFACE_CONTAINER_LOWEST,
        card: SURFACE_CONTAINER_LOW,
        glass: 'rgba(255,255,255,0.80)',
        glassBorder: 'rgba(178,145,70,0.30)',
        error: ERROR,
        surface: SURFACE,
    },
    dark: {
        text: INVERSE_ON_SURFACE,
        textMuted: SURFACE_DIM,
        background: INVERSE_SURFACE,
        tint: INVERSE_PRIMARY,
        tabIconDefault: OUTLINE,
        tabIconSelected: INVERSE_PRIMARY,
        primary: INVERSE_PRIMARY,
        primaryDark: PRIMARY_CONTAINER,
        secondary: SECONDARY,
        accent: PRIMARY_FIXED,
        border: OUTLINE,
        inputBg: '#252320',
        card: '#2A2826',
        glass: 'rgba(49,48,48,0.92)',
        glassBorder: 'rgba(231,194,113,0.28)',
        error: ERROR_CONTAINER,
        surface: INVERSE_SURFACE,
    },
    // Flat — same color repeated so LinearGradient component
    // is preserved in JSX but renders as a plain solid background.
    gradient: [BACKGROUND, BACKGROUND, BACKGROUND, BACKGROUND] as string[],
    locations: [0, 0.35, 0.7, 1] as [number, number, number, number],
};
