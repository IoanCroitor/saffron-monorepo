<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { CheckCircle, AlertCircle, XCircle, Info } from '@lucide/svelte';

	interface Props {
		validationStatus: 'valid' | 'warning' | 'error' | 'none';
		message?: string;
		showDetails?: boolean;
	}

	let { validationStatus = 'none', message = '', showDetails = false }: Props = $props();

	const dispatch = createEventDispatcher();

	function getStatusConfig() {
		switch (validationStatus) {
			case 'valid':
				return {
					icon: CheckCircle,
					color: 'text-green-600',
					bgColor: 'bg-green-50',
					borderColor: 'border-green-200',
					text: 'Valid Connection'
				};
			case 'warning':
				return {
					icon: AlertCircle,
					color: 'text-yellow-600',
					bgColor: 'bg-yellow-50',
					borderColor: 'border-yellow-200',
					text: 'Warning'
				};
			case 'error':
				return {
					icon: XCircle,
					color: 'text-red-600',
					bgColor: 'bg-red-50',
					borderColor: 'border-red-200',
					text: 'Invalid Connection'
				};
			default:
				return {
					icon: Info,
					color: 'text-gray-600',
					bgColor: 'bg-gray-50',
					borderColor: 'border-gray-200',
					text: 'No Connection'
				};
		}
	}

	const config = $derived(getStatusConfig());
	const IconComponent = config.icon;
</script>

{#if validationStatus !== 'none'}
	<div class="connection-validation-indicator">
		<Badge 
			variant="outline" 
			class="flex items-center gap-2 px-3 py-2 {config.bgColor} {config.borderColor} {config.color}"
		>
			<IconComponent class="h-4 w-4" />
			<span class="text-sm font-medium">{config.text}</span>
			{#if message}
				<button
					onclick={() => showDetails = !showDetails}
					class="ml-2 text-xs underline hover:no-underline"
				>
					{showDetails ? 'Hide' : 'Details'}
				</button>
			{/if}
		</Badge>
		
		{#if showDetails && message}
			<div class="mt-2 p-3 {config.bgColor} {config.borderColor} border rounded-lg">
				<p class="text-sm {config.color}">{message}</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.connection-validation-indicator {
		position: fixed;
		top: 100px;
		right: 20px;
		z-index: 1000;
		max-width: 300px;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	/* Dark mode support */
	:global(.dark) .connection-validation-indicator .bg-green-50 {
		background-color: rgba(34, 197, 94, 0.1);
	}

	:global(.dark) .connection-validation-indicator .bg-yellow-50 {
		background-color: rgba(234, 179, 8, 0.1);
	}

	:global(.dark) .connection-validation-indicator .bg-red-50 {
		background-color: rgba(239, 68, 68, 0.1);
	}

	:global(.dark) .connection-validation-indicator .bg-gray-50 {
		background-color: rgba(107, 114, 128, 0.1);
	}
</style> 