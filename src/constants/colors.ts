/**
 * The festival's yearly brand palette — the ONLY file that should need
 * editing each year to reskin the whole app. Everything else (buttons,
 * badges, sidebar, cards, etc.) reads its colors from CSS custom
 * properties that get set from this file at startup (see theme.ts) —
 * change these 7 hex values, and the entire app follows automatically.
 *
 * Neutral/structural values (ink, muted text, borders, white, spacing,
 * radius, shadows, fonts) live in main.css instead and are deliberately
 * NOT part of this file — those are the "standard look" that should
 * stay consistent year to year, per design.
 */
export const COLOUR_PALETTE = {
  primary: '#BF212E',
  navy: '#022E40',
  gold: '#F2A649',
  orange: '#BF5B04',
  alert: '#D92929',
  gray: '#A6A6A6',
  white: '#FFFFFF',
} as const;

// ── Derived shades ──────────────────────────────────────────────────────
// Computed automatically from the base palette above — never edit these
// directly; edit COLOUR_PALETTE instead and these follow.

function clamp(n: number): number {
  return Math.max(0, Math.min(255, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => clamp(Math.round(n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** amount > 0 lightens (mixes toward white), amount < 0 darkens (mixes toward black). */
function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amount > 0 ? 255 : 0;
  const factor = Math.abs(amount);
  return rgbToHex(
    r + (target - r) * factor,
    g + (target - g) * factor,
    b + (target - b) * factor,
  );
}

export const DERIVED_PALETTE = {
  navy: COLOUR_PALETTE.navy,
  navyDeep: shade(COLOUR_PALETTE.navy, -0.35),
  navyMid: shade(COLOUR_PALETTE.navy, 0.15),
  navyLight: shade(COLOUR_PALETTE.navy, 0.3),

  gold: COLOUR_PALETTE.gold,
  goldLight: shade(COLOUR_PALETTE.gold, 0.35),
  gold50: shade(COLOUR_PALETTE.gold, 0.85),
  gold100: shade(COLOUR_PALETTE.gold, 0.7),

  amber: COLOUR_PALETTE.orange,
  amberLight: shade(COLOUR_PALETTE.orange, 0.8),

  red: COLOUR_PALETTE.alert,
  redLight: shade(COLOUR_PALETTE.alert, 0.85),

  primary: COLOUR_PALETTE.primary,
  primaryLight: shade(COLOUR_PALETTE.primary, 0.85),
} as const;