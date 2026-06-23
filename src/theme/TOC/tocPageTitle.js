import React, {useMemo} from 'react';
import Link from '@docusaurus/Link';
import GitHubSlugger from 'github-slugger';
import {useDoc} from '@docusaurus/theme-common/internal';

const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';

export function useContentPageTitle() {
  const {contentTitle, metadata, frontMatter} = useDoc();

  return useMemo(() => {
    if (frontMatter.hide_title) {
      return null;
    }
    const title = contentTitle ?? metadata.title;
    if (!title) {
      return null;
    }
    const slugger = new GitHubSlugger();
    return {value: title, id: slugger.slug(title)};
  }, [contentTitle, metadata.title, frontMatter.hide_title]);
}

export function TocPageTitle() {
  const pageTitle = useContentPageTitle();
  if (!pageTitle) {
    return null;
  }
  return (
    <ul className="table-of-contents table-of-contents__page-title">
      <li key={pageTitle.id}>
        <Link to={`#${pageTitle.id}`} className={LINK_CLASS_NAME}>
          {pageTitle.value}
        </Link>
      </li>
    </ul>
  );
}
