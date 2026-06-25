import React, {useCallback, useRef} from 'react';
import clsx from 'clsx';
import {useCollapsible, Collapsible, useWindowSize} from '@docusaurus/theme-common';
import TOCItems from '@theme/TOCItems';
import CollapseButton from '@theme/TOCCollapsible/CollapseButton';
import MobileTocPortal from '@theme/TOCCollapsible/MobileTocPortal';
import {TocPageTitle} from '@theme/TOC/tocPageTitle';
import styles from './styles.module.css';

function useIsMobileViewport() {
  const windowSize = useWindowSize();
  return windowSize === 'mobile' || windowSize === 'ssr';
}

export default function TOCCollapsible({
  toc,
  className,
  minHeadingLevel,
  maxHeadingLevel,
}) {
  const isMobileViewport = useIsMobileViewport();
  const anchorRef = useRef(null);
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

  const panel = (
    <div className={styles.tocCollapsiblePanel} onClick={handlePanelClick}>
      <TocPageTitle />
      <TOCItems
        toc={tocWithoutH1}
        minHeadingLevel={minHeadingLevel}
        maxHeadingLevel={maxHeadingLevel}
      />
    </div>
  );

  return (
    <div
      ref={anchorRef}
      className={clsx(
        styles.tocCollapsible,
        !collapsed && styles.tocCollapsibleExpanded,
        className,
      )}>
      <CollapseButton collapsed={collapsed} onClick={toggleCollapsed} />
      {isMobileViewport ? (
        !collapsed && (
          <MobileTocPortal anchorRef={anchorRef}>{panel}</MobileTocPortal>
        )
      ) : (
        <Collapsible
          lazy
          className={styles.tocCollapsibleContent}
          collapsed={collapsed}>
          {panel}
        </Collapsible>
      )}
    </div>
  );
}
