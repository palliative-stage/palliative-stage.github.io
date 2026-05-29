const SEARCH_HIGHLIGHT_PARAM = '_highlight';

export function unwrapSearchMarks(root = document.querySelector('article')) {
	if (!root) {
		return;
	}
	root.querySelectorAll('mark').forEach((mark) => {
		const parent = mark.parentNode;
		if (!parent) {
			return;
		}
		parent.replaceChild(document.createTextNode(mark.textContent), mark);
		parent.normalize();
	});
}

/**
 * Remove stale ?_highlight=… params on page-level doc URLs (no section hash).
 */
export function cleanupPageTitleSearchHighlights(location, history) {
	if (typeof window === 'undefined' || !location || !history) {
		return;
	}

	const hasSectionHash = Boolean(location.hash && location.hash.length > 1);
	if (hasSectionHash) {
		return;
	}

	const params = new URLSearchParams(location.search);
	if (!params.has(SEARCH_HIGHLIGHT_PARAM)) {
		return;
	}

	params.delete(SEARCH_HIGHLIGHT_PARAM);
	const paramsStr = params.toString();
	const cleanUrl = location.pathname + (paramsStr ? `?${paramsStr}` : '') + location.hash;
	if (cleanUrl === location.pathname + location.search + location.hash) {
		return;
	}

	unwrapSearchMarks();
	history.replace(cleanUrl);

	const input = document.querySelector('.navbar__search-input');
	if (input) {
		input.value = '';
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}
}
