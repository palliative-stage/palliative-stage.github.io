/**
 * Publishes { title, path } for every doc as global data, so staff screens can
 * turn analytics page titles into links.
 */

/** @type {import('@docusaurus/types').PluginModule} */
module.exports = function pageTitlesPlugin() {
	return {
		name: 'page-titles-plugin',
		async contentLoaded({actions, allContent}) {
			const docsPlugin = allContent['docusaurus-plugin-content-docs'] || {};
			const pages = [];
			for (const content of Object.values(docsPlugin)) {
				for (const version of (content && content.loadedVersions) || []) {
					for (const doc of version.docs) {
						pages.push({title: doc.title, path: doc.permalink});
					}
				}
			}
			actions.setGlobalData({pages});
		},
	};
};
