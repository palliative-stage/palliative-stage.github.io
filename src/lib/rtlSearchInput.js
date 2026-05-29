/**
 * Place the caret at the logical start of an RTL search field (visual right).
 */
export function placeRtlSearchCaret(input) {
	if (!input || typeof window === 'undefined') {
		return;
	}
	requestAnimationFrame(() => {
		try {
			// In RTL, index 0 is the logical start (visual right for Hebrew typing).
			const pos = input.value.length === 0 ? 0 : input.value.length;
			input.setSelectionRange(pos, pos);
		} catch {
			// ignore
		}
	});
}
