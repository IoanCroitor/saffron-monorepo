<script lang="ts">
    import { Check, Loader2 } from '@lucide/svelte';

    interface Props {
        hasUnsavedChanges: boolean;
        isAutoSaving: boolean;
        compact?: boolean;
        alwaysVisible?: boolean;
    }

    let { hasUnsavedChanges, isAutoSaving, compact = false, alwaysVisible = false }: Props = $props();

    // Show indicator when there's activity or when always visible is set
    let shouldShow = $derived(alwaysVisible || hasUnsavedChanges || isAutoSaving);

    let progress = $state(0);
    let animationId: number;

    // Progress animation when saving
    $effect(() => {
        if (isAutoSaving) {
            progress = 0;
            animateProgress();
        } else {
            cancelAnimationFrame(animationId);
            progress = hasUnsavedChanges ? 0 : 100;
        }
    });

    function animateProgress() {
        const startTime = Date.now();
        const duration = 8000; // 8 seconds to match 10 second autosave timing

        function update() {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / duration) * 100, 95);
            progress = newProgress;

            if (newProgress < 95 && isAutoSaving) {
                animationId = requestAnimationFrame(update);
            }
        }

        animationId = requestAnimationFrame(update);
    }

    // Circle stroke color using Tailwind classes that respect dark mode
    let circleColor = $derived(() => {
        if (isAutoSaving) return 'stroke-chart-1'; // Blue for saving
        if (hasUnsavedChanges) return 'stroke-chart-3'; // Orange for unsaved
        return 'stroke-chart-2'; // Green for saved
    });

    // Icon color classes
    let iconColor = $derived(() => {
        if (isAutoSaving) return 'text-chart-1'; // Blue for saving
        if (hasUnsavedChanges) return 'text-chart-3'; // Orange for unsaved
        return 'text-chart-2'; // Green for saved
    });

    // Size classes based on compact mode
    let sizeClasses = $derived(() => {
        if (compact) {
            return {
                container: 'w-4 h-4',
                icon: 'w-2 h-2',
                dot: 'w-1.5 h-1.5'
            };
        }
        return {
            container: 'w-5 h-5',
            icon: 'w-2.5 h-2.5',
            dot: 'w-2 h-2'
        };
    });
</script>

<!-- Always reserve space to prevent layout shifts -->
<div 
    class="save-indicator-inline flex items-center justify-center" 
    class:opacity-0={!shouldShow} 
    class:opacity-100={shouldShow}
>
    <!-- Circular Progress Indicator -->
    <div class="relative {sizeClasses().container}">
        <svg class="{sizeClasses().container} transform -rotate-90" viewBox="0 0 24 24">
            <!-- Background circle -->
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
                class="text-muted-foreground/20"
            />
            <!-- Progress circle -->
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="2"
                fill="none"
                class="{circleColor} transition-all duration-300 ease-out"
                stroke-dasharray="62.83"
                stroke-dashoffset="{62.83 - (progress / 100) * 62.83}"
                stroke-linecap="round"
            />
        </svg>
        
        <!-- Status Icon -->
        <div class="absolute inset-0 flex items-center justify-center">
            {#if isAutoSaving}
                <Loader2 class="{sizeClasses().icon} animate-spin {iconColor}" />
            {:else if hasUnsavedChanges}
                <div class="{sizeClasses().dot} rounded-full bg-chart-3 animate-pulse"></div>
            {:else}
                <Check class="{sizeClasses().icon} {iconColor}" />
            {/if}
        </div>
    </div>
</div>

<style>
    .save-indicator-inline {
        /* Reserve space to prevent layout shifts */
        min-width: fit-content;
        transition: opacity 0.3s ease;
    }

    /* Smooth transitions for colors */
    .save-indicator-inline * {
        transition: color 0.3s ease, stroke 0.3s ease;
    }

    /* Progress circle animation */
    circle {
        transition: stroke-dashoffset 0.3s ease-out;
    }
</style> 