"use strict";

const lunr = require("lunr");

/**
 * buildIndex with Hebrew-safe trimming.
 * The default lunr English trimmer strips \\W from token edges; in JS \\W matches
 * Hebrew letters, which empties every Hebrew token in the index.
 */
function buildIndex(allDocuments, { language, removeDefaultStopWordFilter, removeDefaultStemmer, zhUserDict, zhUserDictPath }) {
	if (language.length > 1 || language.some((item) => item !== "en")) {
		require("lunr-languages/lunr.stemmer.support")(lunr);
	}
	if (language.includes("ja") || language.includes("jp")) {
		require("lunr-languages/tinyseg")(lunr);
	}
	for (const lang of language.filter((item) => item !== "en" && item !== "zh")) {
		require(`lunr-languages/lunr.${lang}`)(lunr);
	}
	if (language.includes("zh")) {
		const { tokenizer, loadUserDict } = require("@easyops-cn/docusaurus-search-local/dist/server/server/utils/tokenizer");
		loadUserDict(zhUserDict, zhUserDictPath);
		require("@easyops-cn/docusaurus-search-local/dist/server/shared/lunrLanguageZh").lunrLanguageZh(lunr, tokenizer);
	}
	if (language.length > 1) {
		require("lunr-languages/lunr.multi")(lunr);
	}

	const hebrewLatinWordChars = /[\u0590-\u05FF\w]/;
	let hebrewTrimmer;
	if (lunr.trimmerSupport) {
		require("lunr-languages/lunr.stemmer.support")(lunr);
		hebrewTrimmer = lunr.trimmerSupport.generateTrimmer(hebrewLatinWordChars);
	}

	return allDocuments.map((documents) => ({
		documents,
		index: lunr(function () {
			if (language.length > 1) {
				this.use(lunr.multiLanguage(...language));
			} else if (language[0] !== "en") {
				this.use(lunr[language[0]]);
			}
			if (removeDefaultStopWordFilter) {
				this.pipeline.remove(lunr.stopWordFilter);
			}
			if (removeDefaultStemmer) {
				this.pipeline.remove(lunr.stemmer);
			}
			// Hebrew + Latin: replace English trimmer that treats Hebrew as non-word.
			this.pipeline.remove(lunr.trimmer);
			if (hebrewTrimmer) {
				this.pipeline.add(hebrewTrimmer);
			}
			if (language.includes("zh")) {
				this.tokenizer = lunr.zh.tokenizer;
			}
			this.ref("i");
			this.field("t");
			this.metadataWhitelist = ["position"];
			documents.forEach((doc) => {
				this.add({ ...doc, i: doc.i.toString() });
			});
		}),
	}));
}

module.exports = { buildIndex };
