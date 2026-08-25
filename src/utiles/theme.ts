import { DERIVED_PALETTE } from '../constants/colors'

/**
 * Injects the current year's brand colors as CSS custom properties on
 * :root, overriding main.css's fallback defaults. Called once at app
 * startup (see main.ts). To reskin for a new year: edit
 * src/constants/colors.ts only — this file itself never needs touching.
 */
export function applyTheme() {
    const root = document.documentElement.style
    root.setProperty('--navy', DERIVED_PALETTE.navy)
    root.setProperty('--navy-deep', DERIVED_PALETTE.navyDeep)
    root.setProperty('--navy-mid', DERIVED_PALETTE.navyMid)
    root.setProperty('--navy-light', DERIVED_PALETTE.navyLight)

    root.setProperty('--gold', DERIVED_PALETTE.gold)
    root.setProperty('--gold-light', DERIVED_PALETTE.goldLight)
    root.setProperty('--gold-50', DERIVED_PALETTE.gold50)
    root.setProperty('--gold-100', DERIVED_PALETTE.gold100)

    root.setProperty('--amber', DERIVED_PALETTE.amber)
    root.setProperty('--amber-light', DERIVED_PALETTE.amberLight)

    root.setProperty('--red', DERIVED_PALETTE.red)
    root.setProperty('--red-light', DERIVED_PALETTE.redLight)

    root.setProperty('--primary', DERIVED_PALETTE.primary)
    root.setProperty('--primary-light', DERIVED_PALETTE.primaryLight)
}
/**To reskin for a new year, you touch exactly one thing:
 *  the 7 hex values at the top of colors.ts. Every button, badge, sidebar, 
 * and card across the whole app follows automatically — no hunting through dozens of files, no risk of missing a spot.*/