const { inject } = require('@vercel/analytics');

module.exports = function vercelAnalytics() {
  return {
    name: 'vercel-analytics',
    injectHtmlTags() {
      return {
        postBodyTags: [{
          tagName: 'script',
          innerHTML: `(${inject.toString()})()`,
        }],
      };
    },
  };
};