<script lang="ts">
	// import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="min-h-screen bg-background">
	<div class="container mx-auto px-4 py-16">
		<div class="max-w-3xl mx-auto">
			<h1 class="text-4xl font-bold text-center mb-8">
				About
			</h1>
			
			<div class="prose prose-lg mx-auto">
				<div class="bg-card rounded-lg shadow-md p-8 mb-8">
					<h2 class="text-2xl font-semibold mb-4">Circuit Simulator</h2>
					<p class="text-muted-foreground mb-4">
						A modern, web-based circuit design and simulation tool built with SvelteKit and TypeScript. 
						This application provides an intuitive interface for designing electronic circuits with 
						real-time visual feedback.
					</p>
				</div>

				<div class="bg-card rounded-lg shadow-md p-8 mb-8">
					<h3 class="text-xl font-semibold mb-4">Features</h3>
					<ul class="space-y-2 text-muted-foreground">
						<li>• Drag-and-drop circuit design interface</li>
						<li>• Comprehensive component library</li>
						<li>• Real-time circuit connections</li>
						<li>• Property editing for components</li>
						<li>• Circuit export functionality</li>
						<li>• Multilingual support (English & Romanian)</li>
						<li>• Developer mode with debugging tools</li>
					</ul>
				</div>

				<div class="bg-card rounded-lg shadow-md p-8 mb-8">
					<h3 class="text-xl font-semibold mb-4">Technology Stack</h3>
					<div class="grid md:grid-cols-2 gap-4 text-muted-foreground">
						<div>
							<strong>Frontend:</strong>
							<ul class="mt-2 space-y-1">
								<li>• SvelteKit</li>
								<li>• TypeScript</li>
								<li>• Tailwind CSS</li>
								<li>• shadcn-svelte</li>
							</ul>
						</div>
						<div>
							<strong>Tools & Libraries:</strong>
							<ul class="mt-2 space-y-1">
								<li>• @xyflow/svelte</li>
								<li>• Inlang Paraglide</li>
								<li>• Lucide Icons</li>
								<li>• Vite</li>
							</ul>
						</div>
					</div>
				</div>

				<div class="text-center">
					<Button href="/test" class="mr-4">
						Try the Demo
					</Button>
					<Button variant="outline" href="/">
						Back to Home
					</Button>
				</div>
			</div>
		</div>
	</div>
</div>
