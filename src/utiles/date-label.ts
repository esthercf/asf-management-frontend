/**
 * '2027-03-20' → 'SAT 20-03' (the weekday in the screen's language). Read at midday, so no time zone
 * can move it to the day before. Used for the day columns of Performance Order and Rehearsals.
 */
export function shortDayLabel(isoDate: string, locale: string): string {
    const date = new Date(`${isoDate}T12:00:00`)
    const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', '').toUpperCase()
    return `${weekday} ${isoDate.slice(8, 10)}-${isoDate.slice(5, 7)}`
}