<script>
	import { onMount } from 'svelte';

	/** @type {{ value?: number, children: import('svelte').Snippet }} */
	let { value = $bindable(0), children } = $props();

	/** @type {HTMLDivElement | undefined} */
	let container;

	onMount(() => {
		if (!container) return;

		const stepEls = Array.from(container.querySelectorAll(':scope > .step'));

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const index = stepEls.indexOf(/** @type {HTMLElement} */ (entry.target));
						if (index !== -1) value = index;
					}
				}
			},
			{ rootMargin: '-40% 0px -40% 0px', threshold: 0 }
		);

		for (const el of stepEls) observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<div bind:this={container}>
	{@render children()}
</div>
