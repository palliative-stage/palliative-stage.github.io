import { tokenize } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/tokenize";
import { smartQueries } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/smartQueries";
import { sortSearchResults } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/sortSearchResults";
import { processTreeStatusOfSearchResults } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/processTreeStatusOfSearchResults";
import { language } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/proxiedGenerated";

/**
 * When the page title (type 0) is already a hit, hide section/content hits for that page.
 */
function collapseSectionResultsUnderPageTitle(results) {
	const pageTitleIds = new Set(results.filter((r) => r.type === 0).map((r) => r.document.i));
	if (pageTitleIds.size === 0) {
		return results;
	}
	return results.filter((r) => r.type === 0 || !pageTitleIds.has(r.document.p));
}

export function SearchSourceFactory(wrappedIndexes, zhDictionary, resultsLimit) {
	return function searchSource(input, callback) {
		const rawTokens = tokenize(input, language);
		if (rawTokens.length === 0) {
			callback([]);
			return;
		}
		const queries = smartQueries(rawTokens, zhDictionary);
		const results = [];
		search: for (const { term, tokens } of queries) {
			for (const { documents, index, type } of wrappedIndexes) {
				results.push(
					...index
						.query((query) => {
							for (const item of term) {
								query.term(item.value, {
									wildcard: item.wildcard,
									presence: item.presence,
								});
							}
						})
						.slice(0, resultsLimit)
						.filter((result) => !results.some((item) => item.document.i.toString() === result.ref))
						.slice(0, resultsLimit - results.length)
						.map((result) => {
							const document = documents.find((doc) => doc.i.toString() === result.ref);
							return {
								document,
								type,
								page:
									type !== 0 && wrappedIndexes[0].documents.find((doc) => doc.i === document.p),
								metadata: result.matchData.metadata,
								tokens,
								score: result.score,
							};
						}),
				);
				if (results.length >= resultsLimit) {
					break search;
				}
			}
		}
		sortSearchResults(results);
		const collapsed = collapseSectionResultsUnderPageTitle(results);
		processTreeStatusOfSearchResults(collapsed);
		callback(collapsed);
	};
}
