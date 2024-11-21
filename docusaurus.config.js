// @ts-nocheck
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
	title: 'Palliative Care',
//	url: 'https://palliative-stage.github.io',
	url: 'https://cdel-palliative.org.il/',
	baseUrl: '/',
	onBrokenLinks: 'throw',
	onBrokenMarkdownLinks: 'warn',
	favicon: 'img/favicon.ico',
	organizationName: 'palliative-stage',
	projectName: 'palliative-stage.github.io',
	deploymentBranch: 'gh-pages',
	trailingSlash: false,

	plugins: [
		'@docusaurus/preset-classic',
		{
		  docs: {
			editUrl: null,  // Add this line
		  },
		},
	  ],
	
	scripts: [
		{
		  src: '/analytics.js',
		  async: true,
		},
	  ],

	presets: [
		[
			'classic',
			/** @type {import('@docusaurus/preset-classic').Options} */
			({
				docs: {
					routeBasePath: '/',
					sidebarPath: require.resolve('./sidebars.js'),
					editUrl:
						'https://github.com/palliative-stage/palliative-stage.github.io/tree/master/',
				},
				blog: false,
				theme: {
					customCss: require.resolve('./src/css/custom.css'),
				},
			}),
		],
	],

	themeConfig:
		/** @type {import('@docusaurus/preset-classic').ThemeConfig} */
		({
			navbar: {
				title: 'טיפול פליאטיבי', // TODO
				logo: {
					alt: 'My Site Logo', // TODO
					src: 'img/logo.svg', // TODO
				},
			},
			footer: {
				// TODO - Customize footer
				style: 'dark',
				links: [
					{
						title: 'Docs',
						items: [
							{
								label: 'Tutorial',
								to: '/',
							},
						],
					},
					{
						title: 'Community',
						items: [
							{
								label: 'Stack Overflow',
								href: 'https://stackoverflow.com/questions/tagged/docusaurus',
							},
							{
								label: 'Discord',
								href: 'https://discordapp.com/invite/docusaurus',
							},
							{
								label: 'Twitter',
								href: 'https://twitter.com/docusaurus',
							},
						],
					},
				],
				copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`, // TODO
			},
			prism: {
				theme: lightCodeTheme,
				darkTheme: darkCodeTheme,
			},
		}),

	i18n: {
		defaultLocale: 'he',
		locales: ['he'],
		localeConfigs: {
			he: {
				label: 'Hebrew',
				direction: 'rtl',
			},
		},
	},

	plugins: [
		[
			'@docusaurus/plugin-pwa',
			{
				offlineModeActivationStrategies: ['appInstalled', 'standalone', 'mobile'],
				pwaHead: [
					{
						tagName: 'link',
						rel: 'icon',
						href: '/img/pal-favicon.png',
					},
					{
						tagName: 'link',
						rel: 'manifest',
						href: '/manifest.json',
					},
					{
						tagName: 'meta',
						name: 'theme-color',
						content: 'rgb(37, 194, 160)',
					},
					{
						tagName: 'meta',
						name: 'apple-mobile-web-app-capable',
						content: 'yes',
					},
					{
						tagName: 'meta',
						name: 'apple-mobile-web-app-status-bar-style',
						content: '#000',
					},
					{
						tagName: 'link',
						rel: 'apple-touch-icon',
						href: '/img/pal-favicon.png',
					},
					{
						tagName: 'link',
						rel: 'mask-icon',
						href: '/img/log.svg',
						color: 'rgb(37, 194, 160)',
					},
					{
						tagName: 'meta',
						name: 'msapplication-TileImage',
						content: '/img/pal-favicon.png',
					},
					{
						tagName: 'meta',
						name: 'msapplication-TileColor',
						content: '#000',
					},
				],
			},
		],
	],
};

module.exports = config;
  
