const fs = require('fs-extra');
const path = require('path');

const SITE_NAME = 'טיפול פליאטיבי';
const SITE_DESCRIPTION =
	'הנחיות סקוטיות לטיפול פליאטיבי, מותאמות לישראל. שיתוף פעולה של קבוצת פליאציה NET ומרכז תום (האוניברסיטה העברית).';

/** @type {import('@docusaurus/types').PluginModule} */
module.exports = function homepageOgPlugin() {
	return {
		name: 'homepage-og-plugin',
		async postBuild({outDir}) {
			const indexPath = path.join(outDir, 'index.html');
			if (!(await fs.pathExists(indexPath))) {
				return;
			}

			let html = await fs.readFile(indexPath, 'utf8');

			// LinkedIn profile links point at /. Use the site name as og:title, not the doc H1.
			html = html.replace(
				/property="og:title" content="[^"]*"/,
				`property="og:title" content="${SITE_NAME}"`,
			);
			html = html.replace(
				/property="og:description" content="[^"]*"/,
				`property="og:description" content="${SITE_DESCRIPTION}"`,
			);
			html = html.replace(
				/name="description" content="[^"]*"/,
				`name="description" content="${SITE_DESCRIPTION}"`,
			);

			await fs.writeFile(indexPath, html);
		},
	};
};
