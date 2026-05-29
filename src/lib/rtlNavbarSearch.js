const RTL_SEARCH_LABEL = 'חיפוש';

export function applyRtlNavbarSearch(root = document) {
	if (typeof document === 'undefined') {
		return;
	}

	const scope = root === document ? document : root;

	const input = scope.querySelector?.('.navbar__search-input') ?? null;
	if (input) {
		input.setAttribute('dir', 'rtl');
		input.setAttribute('placeholder', '');
		if (input.getAttribute('aria-label') === 'Search' || !input.getAttribute('aria-label')) {
			input.setAttribute('aria-label', RTL_SEARCH_LABEL);
		}
		input.style.padding = '0 2.25rem 0 3.75rem';
		input.style.background =
			'var(--ifm-navbar-search-input-background-color) var(--ifm-navbar-search-input-icon) no-repeat right 0.75rem center / 1rem 1rem';
		input.style.textAlign = 'right';
	}

	const hint = scope.querySelector?.('[class*="searchHintContainer"]');
	if (hint) {
		hint.style.left = '10px';
		hint.style.right = 'auto';
		hint.style.direction = 'ltr';
		hint.style.flexDirection = 'row';
	}
}

export function placeRtlSearchCaret(input) {
	requestAnimationFrame(() => {
		try {
			input.setSelectionRange(0, 0);
		} catch {
			// ignore
		}
	});
}
