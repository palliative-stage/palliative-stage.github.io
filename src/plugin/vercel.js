import { inject } from '@vercel/analytics';

export default function vercelAnalytics() {
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
}