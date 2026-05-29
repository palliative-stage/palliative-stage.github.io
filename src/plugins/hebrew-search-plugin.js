const path = require("path");
const fs = require("fs-extra");

function patchBuildIndex() {
	const buildIndexModule = require("@easyops-cn/docusaurus-search-local/dist/server/server/utils/buildIndex");
	if (buildIndexModule.__hebrewSearchPatched) {
		return;
	}
	const { buildIndex } = require("./hebrew-search-buildIndex");
	buildIndexModule.buildIndex = buildIndex;
	buildIndexModule.__hebrewSearchPatched = true;
}

/** @type {import('@docusaurus/types').PluginModule} */
module.exports = function hebrewSearchPlugin() {
	return {
		name: "hebrew-search-plugin",
		loadContent() {
			patchBuildIndex();
		},
		configureWebpack(_config, isServer) {
			if (isServer) {
				return {};
			}
			const fetchIndexesPath = require.resolve(
				"@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/fetchIndexes",
			);
			const searchSourceFactoryPath = require.resolve(
				"@easyops-cn/docusaurus-search-local/dist/client/client/utils/SearchSourceFactory",
			);
			return {
				resolve: {
					alias: {
						[fetchIndexesPath]: path.resolve(__dirname, "fetchIndexesDev.js"),
						[searchSourceFactoryPath]: path.resolve(__dirname, "searchSourceFactory.js"),
					},
				},
			};
		},
		async postBuild({ outDir, siteDir }) {
			const src = path.join(outDir, "search-index.json");
			if (!(await fs.pathExists(src))) {
				return;
			}
			await fs.copy(src, path.join(siteDir, "static", "search-index.json"));
		},
	};
};
