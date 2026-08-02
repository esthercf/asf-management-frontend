/**
 * This logic must satisfy the institutionCreateSchema password rules.
 */
export function generateStrongPassword(length = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const all = uppercase + lowercase + numbers + special;

    const randomChar = (chars: string) => chars[Math.floor((crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) * chars.length)];

    const required = [randomChar(uppercase), randomChar(lowercase), randomChar(numbers), randomChar(special)];

    const rest = Array.from({ length: length - required.length }, () => randomChar(all));
 
    // Fisher-Yates shuffle
    const arr = [...required, ...rest];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(
            crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * (i + 1)
        );
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
 
    return arr.join('');
}

/**
 * Forces browser password managers to recognize programmatically changed input values
 * without breaking internal component states.
 *
 * @param {string} selector - The CSS selector for the input element
 * @param {string} value - The new value to set
 */

export function forceBrowserInputChange(selector: string, value: string) {
    const inputEl = document.querySelector(selector);
    if (!inputEl) return;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    if (nativeInputValueSetter && nativeInputValueSetter.set) {
        nativeInputValueSetter.set.call(inputEl, value);
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
}