import React from 'react';
import clsx from 'clsx';
import TOCItems from '@theme/TOCItems';
import {TocPageTitle} from './tocPageTitle';
import styles from './styles.module.css';

const LINK_CLASS_NAME = 'table-of-contents__link toc-highlight';
const LINK_ACTIVE_CLASS_NAME = 'table-of-contents__link--active';

export default function TOC({className, toc, ...props}) {
  const tocWithoutH1 = toc?.filter((heading) => heading.level !== 1) ?? [];

  return (
    <div className={clsx(styles.tableOfContents, 'thin-scrollbar', className)}>
      <TocPageTitle />
      <TOCItems
        {...props}
        toc={tocWithoutH1}
        linkClassName={LINK_CLASS_NAME}
        linkActiveClassName={LINK_ACTIVE_CLASS_NAME}
      />
    </div>
  );
}
