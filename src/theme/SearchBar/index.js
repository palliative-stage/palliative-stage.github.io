import React, { useEffect, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import SearchBar from '@theme-original/SearchBar';
import { applyRtlNavbarSearch, placeRtlSearchCaret } from '@site/src/lib/rtlNavbarSearch';

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

		const sync = () => applyRtlNavbarSearch(root);
		sync();
		const timer = window.setTimeout(sync, 0);

		const onFocusIn = (event) => {
			const input = event.target.closest?.('.navbar__search-input');
			if (input && root.contains(input)) {
				applyRtlNavbarSearch(root);
				placeRtlSearchCaret(input);
			}
		};

		root.addEventListener('focusin', onFocusIn);

		return () => {
			window.clearTimeout(timer);
			root.removeEventListener('focusin', onFocusIn);
		};
	}, [isRtl]);

	return (
		<div ref={wrapperRef}>
			<SearchBar {...props} />
		</div>
	);
}
