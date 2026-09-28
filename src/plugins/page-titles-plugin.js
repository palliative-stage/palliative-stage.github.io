/**
 * Publishes { title, path } for every doc, plus every sidebar label, as global
 * data, so staff screens can turn analytics page titles into links and tell
 * navigation clicks apart.
 */

function collectSidebarLabels(items, labels) {
	for (const item of items || []) {
		if (item.label) labels.add(item.label);
		if (item.items) collectSidebarLabels(item.items, labels);
	}
}

/** @type {import('@docusaurus/types').PluginModule} */
module.exports = function pageTitlesPlugin() {
	return {
		name: 'page-titles-plugin',
		async contentLoaded({actions, allContent}) {
			const docsPlugin = allContent['docusaurus-plugin-content-docs'] || {};
			const pages = [];
			const labels = new Set();
			for (const content of Object.values(docsPlugin)) {
				for (const version of (content && content.loadedVersions) || []) {
					for (const doc of version.docs) {
						pages.push({title: doc.title, path: doc.permalink});
					}
					for (const sidebar of Object.values(version.sidebars || {})) {
						collectSidebarLabels(sidebar, labels);
					}
				}
			}
			actions.setGlobalData({pages, sidebarLabels: [...labels]});
		},
	};
};
