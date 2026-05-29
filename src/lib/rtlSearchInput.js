/**
 * Place the caret at the logical start of an RTL search field (visual right).
 */
export function placeRtlSearchCaret(input) {
	if (!input || typeof window === 'undefined') {
		return;
	}
	requestAnimationFrame(() => {
		try {
			const len = input.value.length;
			input.setSelectionRange(len, len);
		} catch {
			// ignore
		}
	});
}
