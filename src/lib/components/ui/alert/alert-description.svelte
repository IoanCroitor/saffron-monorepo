<script lang="ts">
	import { cn } from "$lib/utils";
	import type { HTMLAttributes } from "svelte/elements";

	let className: string | undefined = undefined;
	export { className as class };
	export let rest: HTMLAttributes<HTMLParagraphElement> = {};
</script>

<p class={cn("text-sm [&_p]:leading-relaxed", className)} {...rest}>
	<slot />
</p> 