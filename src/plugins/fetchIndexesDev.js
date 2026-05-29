import lunr from "lunr";
import { searchIndexUrl } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/proxiedGenerated.js";

const cache = new Map();

export function fetchIndexes(baseUrl, searchContext) {
	const cacheKey = `${baseUrl}${searchContext}`;
	let promise = cache.get(cacheKey);
	if (!promise) {
		promise = legacyFetchIndexes(baseUrl, searchContext);
		cache.set(cacheKey, promise);
	}
	return promise;
}

export async function legacyFetchIndexes(baseUrl, searchContext) {
	const indexPath = searchIndexUrl.replace(
		"{dir}",
		searchContext ? `-${searchContext.replace(/\//g, "-")}` : "",
	);
	try {
		const response = await fetch(`${baseUrl}${indexPath}`);
		if (!response.ok) {
			return { wrappedIndexes: [], zhDictionary: [] };
		}
		const json = await response.json();
		const wrappedIndexes = json.map(({ documents, index }, type) => ({
			type,
			documents,
			index: lunr.Index.load(index),
		}));
		const zhDictionary = json.reduce((acc, item) => {
			for (const tuple of item.index.invertedIndex) {
				if (/\p{Unified_Ideograph}/u.test(tuple[0][0])) {
					acc.add(tuple[0]);
				}
			}
			return acc;
		}, new Set());
		return {
			wrappedIndexes,
			zhDictionary: Array.from(zhDictionary),
		};
	} catch {
		return { wrappedIndexes: [], zhDictionary: [] };
	}
}
