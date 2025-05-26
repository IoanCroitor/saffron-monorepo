// Temporarily disable the SvelteKit adapter to bypass the guessTextDirMap bug
// import { createI18n } from '@inlang/paraglide-sveltekit';
import * as runtime from '$lib/paraglide/runtime.js';

/**
 * Enhanced i18n object that provides proper functionality while bypassing the guessTextDirMap bug
 * This is a workaround implementation that replicates the essential features of createI18n
 */
export const i18n = {
	/**
	 * Route function with locale-aware URL handling
	 * @param {string} path - The path to localize
	 * @returns {string} - The localized path
	 */
	route: (path) => {
		try {
			const currentLocale = runtime.getLocale();
			// If current locale is base locale (en), don't add prefix
			if (currentLocale === runtime.baseLocale) {
				return path;
			}
			// Add locale prefix for non-base locales
			return `/${currentLocale}${path.startsWith('/') ? path : '/' + path}`;
		} catch {
			// Fallback if locale detection fails
			return path;
		}
	},
	
	/**
	 * Text direction function that returns proper direction based on locale
	 * @param {string} [locale] - Optional locale override
	 * @returns {string} - Text direction ('ltr' or 'rtl')
	 */
	textDirection: (locale) => {
		// Both en and ro-ro use left-to-right text direction
		const targetLocale = locale || runtime.getLocale?.() || runtime.baseLocale;
		// Add more locale-specific directions as needed
		const rtlLocales = ['ar', 'he', 'fa', 'ur'];
		return rtlLocales.includes(targetLocale) ? 'rtl' : 'ltr';
	},
	
	/**
	 * Get current locale with fallback
	 * @returns {string} - Current locale
	 */
	get locale() {
		try {
			return runtime.getLocale?.() || runtime.baseLocale;
		} catch {
			return runtime.baseLocale;
		}
	},
	
	/**
	 * Get available locales
	 * @returns {readonly string[]} - Array of available locales
	 */
	get locales() {
		return runtime.locales;
	},
	
	/**
	 * Get base locale
	 * @returns {string} - Base locale
	 */
	get baseLocale() {
		return runtime.baseLocale;
	},
	
	// Runtime reference for compatibility
	runtime
};
