/**
 * Scroll to the heading in the URL hash on first load and route changes.
 *
 * Docusaurus 2.3 only scrolls for in-app navigation. A fresh tab relies on the
 * browser, which does not match percent-encoded Hebrew hashes to heading ids
 * (e.g. #%D7%94… vs id="העסקת-עובד-זר"). Copied section URLs then open at the
 * top of the page.
 */

const RETRY_MS = 50;
const MAX_ATTEMPTS = 40;

let pendingTimer = null;

function clearPending() {
	if (pendingTimer !== null) {
		window.clearInterval(pendingTimer);
		pendingTimer = null;
	}
}

function hashToIds(hash) {
	if (!hash || hash === '#') {
		return [];
	}
	const raw = hash.charAt(0) === '#' ? hash.slice(1) : hash;
	if (!raw) {
		return [];
	}
	const ids = [raw];
	try {
		const decoded = decodeURIComponent(raw);
		if (decoded && decoded !== raw) {
			ids.push(decoded);
		}
	} catch {
		// Malformed percent-encoding — keep the raw id only.
	}
	return ids;
}

function getHashElement(hash) {
	if (typeof document === 'undefined') {
		return null;
	}
	for (const id of hashToIds(hash)) {
		const el = document.getElementById(id);
		if (el) {
			return el;
		}
	}
	return null;
}

function scrollToHash(hash) {
	const el = getHashElement(hash);
	if (!el) {
		return false;
	}
	el.scrollIntoView();
	return true;
}

function scrollToLocationHash(hash) {
	if (typeof window === 'undefined' || !hash) {
		return;
	}
	clearPending();
	if (scrollToHash(hash)) {
		return;
	}
	let attempts = 0;
	pendingTimer = window.setInterval(() => {
		attempts += 1;
		if (scrollToHash(hash) || attempts >= MAX_ATTEMPTS) {
			clearPending();
		}
	}, RETRY_MS);
}

export function onRouteDidUpdate({location}) {
	if (location?.hash) {
		scrollToLocationHash(location.hash);
	} else {
		clearPending();
	}
}

if (typeof window !== 'undefined') {
	if (window.location.hash) {
		scrollToLocationHash(window.location.hash);
	}
	window.addEventListener('hashchange', () => {
		scrollToLocationHash(window.location.hash);
	});
}
