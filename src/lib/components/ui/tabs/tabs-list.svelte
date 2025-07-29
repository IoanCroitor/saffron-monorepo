<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	class={cn(
		"inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]",
		// Light mode styling - much better contrast with darker background
		"bg-muted/90 border border-border shadow-sm",
		// Dark mode styling
		"dark:bg-muted dark:border-border/20",
		className
	)}
	{...restProps}
/>
