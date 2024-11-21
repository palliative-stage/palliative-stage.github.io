import React from 'react';
import { inject } from '@vercel/analytics';

inject();

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}