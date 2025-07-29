// Shared color definitions for circuit components
// These colors match the sidebar ComponentIcon colors

export const componentColors = {
	// Passive Components
	resistor: {
		icon: 'text-red-500',
		border: '#ef4444',
		selectedBorder: '#dc2626',
		selectedShadow: 'rgba(239, 68, 68, 0.2)',
		handle: '#ef4444'
	},
	capacitor: {
		icon: 'text-blue-500',
		border: '#3b82f6',
		selectedBorder: '#2563eb',
		selectedShadow: 'rgba(59, 130, 246, 0.2)',
		handle: '#3b82f6'
	},
	inductor: {
		icon: 'text-green-500',
		border: '#22c55e',
		selectedBorder: '#16a34a',
		selectedShadow: 'rgba(34, 197, 94, 0.2)',
		handle: '#22c55e'
	},
	
	// Sources
	voltageSource: {
		icon: 'text-orange-500',
		border: '#f97316',
		selectedBorder: '#ea580c',
		selectedShadow: 'rgba(249, 115, 22, 0.2)',
		handle: '#f97316'
	},
	currentSource: {
		icon: 'text-purple-500',
		border: '#a855f7',
		selectedBorder: '#9333ea',
		selectedShadow: 'rgba(168, 85, 247, 0.2)',
		handle: '#a855f7'
	},
	ground: {
		icon: 'text-gray-600 dark:text-gray-400',
		border: '#6b7280',
		selectedBorder: '#4b5563',
		selectedShadow: 'rgba(107, 114, 128, 0.2)',
		handle: '#6b7280'
	},
	
	// Semiconductors
	diode: {
		icon: 'text-yellow-500',
		border: '#eab308',
		selectedBorder: '#ca8a04',
		selectedShadow: 'rgba(234, 179, 8, 0.2)',
		handle: '#eab308'
	},
	transistor: {
		icon: 'text-indigo-500',
		border: '#6366f1',
		selectedBorder: '#4f46e5',
		selectedShadow: 'rgba(99, 102, 241, 0.2)',
		handle: '#6366f1'
	},
	opamp: {
		icon: 'text-pink-500',
		border: '#ec4899',
		selectedBorder: '#db2777',
		selectedShadow: 'rgba(236, 72, 153, 0.2)',
		handle: '#ec4899'
	},
	
	// Measurement
	voltmeter: {
		icon: 'text-cyan-500',
		border: '#06b6d4',
		selectedBorder: '#0891b2',
		selectedShadow: 'rgba(6, 182, 212, 0.2)',
		handle: '#06b6d4'
	},
	ammeter: {
		icon: 'text-emerald-500',
		border: '#10b981',
		selectedBorder: '#059669',
		selectedShadow: 'rgba(16, 185, 129, 0.2)',
		handle: '#10b981'
	},
	probe: {
		icon: 'text-rose-500',
		border: '#f43f5e',
		selectedBorder: '#e11d48',
		selectedShadow: 'rgba(244, 63, 94, 0.2)',
		handle: '#f43f5e'
	}
};

export type ComponentType = keyof typeof componentColors;

export function getComponentColors(type: ComponentType) {
	return componentColors[type] || componentColors.resistor;
}

export function getComponentIconClass(type: ComponentType) {
	return componentColors[type]?.icon || 'text-foreground';
} 