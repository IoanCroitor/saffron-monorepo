import { writable } from 'svelte/store';

export interface SettingsState {
	coloredHandles: boolean;
	snapToGrid: boolean;
	showGrid: boolean;
	gridSize: number;
	autoSave: boolean;
	autoSaveInterval: number;
}

const defaultSettings: SettingsState = {
	coloredHandles: true,
	snapToGrid: true,
	showGrid: true,
	gridSize: 20,
	autoSave: true,
	autoSaveInterval: 30000 // 30 seconds
};

// Load settings from localStorage if available
function loadSettings(): SettingsState {
	if (typeof window === 'undefined') {
		return defaultSettings;
	}
	
	try {
		const stored = localStorage.getItem('editor-settings');
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...defaultSettings, ...parsed };
		}
	} catch (error) {
		console.warn('Failed to load settings from localStorage:', error);
	}
	
	return defaultSettings;
}

// Save settings to localStorage
function saveSettings(settings: SettingsState) {
	if (typeof window === 'undefined') {
		return;
	}
	
	try {
		localStorage.setItem('editor-settings', JSON.stringify(settings));
	} catch (error) {
		console.warn('Failed to save settings to localStorage:', error);
	}
}

function createSettingsStore() {
	const { subscribe, set, update } = writable<SettingsState>(loadSettings());

	return {
		subscribe,
		set: (value: SettingsState) => {
			set(value);
			saveSettings(value);
		},
		update: (updater: (value: SettingsState) => SettingsState) => {
			update((current) => {
				const newValue = updater(current);
				saveSettings(newValue);
				return newValue;
			});
		},
		reset: () => {
			set(defaultSettings);
			saveSettings(defaultSettings);
		},
		toggleColoredHandles: () => {
			update((current) => {
				const newValue = { ...current, coloredHandles: !current.coloredHandles };
				saveSettings(newValue);
				return newValue;
			});
		},
		toggleSnapToGrid: () => {
			update((current) => {
				const newValue = { ...current, snapToGrid: !current.snapToGrid };
				saveSettings(newValue);
				return newValue;
			});
		},
		toggleShowGrid: () => {
			update((current) => {
				const newValue = { ...current, showGrid: !current.showGrid };
				saveSettings(newValue);
				return newValue;
			});
		},
		setGridSize: (size: number) => {
			update((current) => {
				const newValue = { ...current, gridSize: size };
				saveSettings(newValue);
				return newValue;
			});
		},
		toggleAutoSave: () => {
			update((current) => {
				const newValue = { ...current, autoSave: !current.autoSave };
				saveSettings(newValue);
				return newValue;
			});
		},
		setAutoSaveInterval: (interval: number) => {
			update((current) => {
				const newValue = { ...current, autoSaveInterval: interval };
				saveSettings(newValue);
				return newValue;
			});
		}
	};
}

export const settingsStore = createSettingsStore();