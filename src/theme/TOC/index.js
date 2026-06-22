import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import TOCItems from '@theme/TOCItems';
import styles from '@theme-original/TOC/styles.module.css';

export default function TOC({
  className,
  toc,
  minHeadingLevel,
  maxHeadingLevel,
  ...props
}) {
  const h1Headings = toc?.filter((heading) => heading.level === 1) ?? [];
  const tocWithoutH1 = toc?.filter((heading) => heading.level !== 1) ?? [];

  return (
    <div className={clsx(styles.tableOfContents, 'thin-scrollbar', className)}>
      {h1Headings.length > 0 && (
        <ul className="table-of-contents table-of-contents__page-title">
          {h1Headings.map((heading) => (
            <li key={heading.id}>
              <Link to={`#${heading.id}`} className="table-of-contents__link">
                {heading.value}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <TOCItems
        toc={tocWithoutH1}
        minHeadingLevel={minHeadingLevel}
        maxHeadingLevel={maxHeadingLevel}
        className="table-of-contents table-of-contents__left-border"
        linkClassName="table-of-contents__link"
        linkActiveClassName="table-of-contents__link--active"
        {...props}
      />
    </div>
  );
}
