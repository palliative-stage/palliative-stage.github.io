import React, { useEffect, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import SearchBar from '@theme-original/SearchBar';

const RTL_SEARCH_LABEL = 'חיפוש';

function placeRtlCaret(input) {
	requestAnimationFrame(() => {
		try {
			input.setSelectionRange(0, 0);
		} catch {
			// ignore when input type does not support selection
		}
	});
}

function applyRtlSearchInput(input) {
	input.setAttribute('dir', 'rtl');
	input.setAttribute('placeholder', '');
	if (input.getAttribute('aria-label') === 'Search' || !input.getAttribute('aria-label')) {
		input.setAttribute('aria-label', RTL_SEARCH_LABEL);
	}
}

export default function RtlSearchBar(props) {
	const { i18n } = useDocusaurusContext();
	const isRtl = i18n.currentLocale === 'he';
	const wrapperRef = useRef(null);

	useEffect(() => {
		if (!isRtl) {
			return undefined;
		}

		const root = wrapperRef.current;
		if (!root) {
			return undefined;
		}

		const syncInput = () => {
			const input = root.querySelector('.navbar__search-input');
			if (input) {
				applyRtlSearchInput(input);
			}
		};

		syncInput();

		const observer = new MutationObserver(syncInput);
		observer.observe(root, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['placeholder', 'dir', 'aria-label', 'class'],
		});

		const onFocusIn = (event) => {
			const input = event.target.closest?.('.navbar__search-input');
			if (input && root.contains(input)) {
				applyRtlSearchInput(input);
				placeRtlCaret(input);
			}
		};

		root.addEventListener('focusin', onFocusIn);

		return () => {
			observer.disconnect();
			root.removeEventListener('focusin', onFocusIn);
		};
	}, [isRtl]);

	return (
		<div ref={wrapperRef} className="navbar-search-rtl">
			<SearchBar {...props} />
		</div>
	);
}
