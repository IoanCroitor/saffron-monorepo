<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	type Variant = "default" | "destructive";

	let className: string | undefined = undefined;
	export { className as class };
	export let variant: Variant = "default";

	$: cnClass = cn(
		"relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
		{
			"text-destructive border-destructive/50 text-destructive": variant === "destructive"
		},
		className
	);

	export let rest: HTMLAttributes<HTMLDivElement> = {};
</script>

<div class={cnClass} {...rest}>
	<slot />
</div> 