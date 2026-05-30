/**
 * Place the caret at the visual right for Hebrew RTL search inputs.
 */
export function placeRtlSearchCaret(input) {
	if (!input || typeof window === 'undefined') {
		return;
	}

	const apply = () => {
		try {
			input.setAttribute('dir', 'rtl');
			input.style.textAlign = 'right';
			const pos = input.value.length;
			input.setSelectionRange(pos, pos);
		} catch {
			// ignore
		}
	};

	apply();
	requestAnimationFrame(apply);
	window.setTimeout(apply, 50);
}
