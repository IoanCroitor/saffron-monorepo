<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.TriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(
		"inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent px-2 py-1 text-sm font-medium transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		// Base styling
		"bg-muted/60 text-muted-foreground",
		// Light mode active state - using primary colors
		"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm data-[state=active]:font-semibold",
		// Dark mode styling
		"dark:bg-muted/40 dark:text-muted-foreground dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-primary",
		// Focus styling
		"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring",
		className
	)}
	{...restProps}
/>
