import React from 'react';
import Link from '@docusaurus/Link';
import {createSlugger} from '@docusaurus/utils';
import {useDoc} from '@docusaurus/theme-common/internal';

const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';

export function useContentPageTitle() {
  const {contentTitle, metadata, frontMatter} = useDoc();
  if (frontMatter.hide_title) {
    return null;
  }
  const title = contentTitle ?? metadata.title;
  if (!title) {
    return null;
  }
  const slugger = createSlugger();
  return {value: title, id: slugger.slug(title)};
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
