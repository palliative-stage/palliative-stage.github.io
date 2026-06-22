import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import TOCItems from '@theme/TOCItems';
import styles from './styles.module.css';

const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

export default function TOC({className, toc, ...props}) {
  const h1Headings = toc?.filter((heading) => heading.level === 1) ?? [];
  const tocWithoutH1 = toc?.filter((heading) => heading.level !== 1) ?? [];

  return (
    <div className={clsx(styles.tableOfContents, 'thin-scrollbar', className)}>
      {h1Headings.length > 0 && (
        <ul className="table-of-contents table-of-contents__page-title">
          {h1Headings.map((heading) => (
            <li key={heading.id}>
              <Link to={`#${heading.id}`} className={LINK_CLASS_NAME}>
                {heading.value}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <TOCItems
        {...props}
        toc={tocWithoutH1}
        linkClassName={LINK_CLASS_NAME}
        linkActiveClassName={LINK_ACTIVE_CLASS_NAME}
      />
    </div>
  );
}
