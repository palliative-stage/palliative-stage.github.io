import React, {useCallback} from 'react';
import clsx from 'clsx';
import {useCollapsible, Collapsible} from '@docusaurus/theme-common';
import TOCItems from '@theme/TOCItems';
import CollapseButton from '@theme/TOCCollapsible/CollapseButton';
import {TocPageTitle} from '@theme/TOC/tocPageTitle';
import styles from './styles.module.css';

export default function TOCCollapsible({
  toc,
  className,
  minHeadingLevel,
  maxHeadingLevel,
}) {
  const {collapsed, toggleCollapsed, setCollapsed} = useCollapsible({
    initialState: true,
  });
  const tocWithoutH1 = toc?.filter((heading) => heading.level !== 1) ?? [];

  const handlePanelClick = useCallback(
    (event) => {
      if (event.target.closest('a')) {
        setCollapsed(true);
      }
    },
    [setCollapsed],
  );

  return (
    <div
      className={clsx(
        styles.tocCollapsible,
        !collapsed && styles.tocCollapsibleExpanded,
        className,
      )}>
      <CollapseButton collapsed={collapsed} onClick={toggleCollapsed} />
      <Collapsible
        lazy
        className={styles.tocCollapsibleContent}
        collapsed={collapsed}>
        <div className={styles.tocCollapsiblePanel} onClick={handlePanelClick}>
          <TocPageTitle />
          <TOCItems
            toc={tocWithoutH1}
            minHeadingLevel={minHeadingLevel}
            maxHeadingLevel={maxHeadingLevel}
          />
        </div>
      </Collapsible>
    </div>
  );
}
