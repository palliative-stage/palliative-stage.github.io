import React from 'react';
import Layout from '@theme/Layout';
import Head from '@docusaurus/Head';

export default function StaffShell({ title, dir = 'rtl', lang = 'he', children }) {
  return (
    <Layout title={title}>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className={dir === 'ltr' ? 'staff-page staff-page--en' : 'staff-page'} dir={dir} lang={lang}>
        {children}
      </main>
    </Layout>
  );
}
