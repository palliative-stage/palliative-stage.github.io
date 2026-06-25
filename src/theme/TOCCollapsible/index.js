import React, {useRef, useState} from 'react';
import clsx from 'clsx';
import {useCollapsible, Collapsible, useWindowSize} from '@docusaurus/theme-common';
import TOCItems from '@theme/TOCItems';
import CollapseButton from '@theme/TOCCollapsible/CollapseButton';
import {TocPageTitle} from '@theme/TOC/tocPageTitle';
import styles from './styles.module.css';

function useIsMobileTocViewport() {
  const windowSize = useWindowSize();
  return windowSize === 'mobile' || windowSize === 'tablet' || windowSize === 'ssr';
}

export default function TOCCollapsible({
  toc,
  className,
  minHeadingLevel,
  maxHeadingLevel,
}) {
  const isMobileViewport = useIsMobileTocViewport();
  const {collapsed, toggleCollapsed} = useCollapsible({
    initialState: true,
  });
  const tocWithoutH1 = toc?.filter((heading) => heading.level !== 1) ?? [];
  const containerRef = useRef(null);
  const [placeholderHeight, setPlaceholderHeight] = useState(0);
  const showMobileOverlay = isMobileViewport && !collapsed;

  const handleToggle = () => {
    if (isMobileViewport) {
      if (collapsed && containerRef.current) {
        setPlaceholderHeight(containerRef.current.offsetHeight);
      } else {
        setPlaceholderHeight(0);
      }
    }
    toggleCollapsed();
  };

  return (
    <>
      {showMobileOverlay && (
        <button
          type="button"
          className={styles.tocCollapsibleBackdrop}
          aria-label="סגור ניווט בדף זה"
          onClick={handleToggle}
        />
      )}
      {showMobileOverlay && placeholderHeight > 0 && (
        <div
          className={styles.tocCollapsiblePlaceholder}
          style={{height: placeholderHeight}}
          aria-hidden="true"
        />
      )}
      <div
        ref={containerRef}
        className={clsx(
          styles.tocCollapsible,
          !collapsed && styles.tocCollapsibleExpanded,
          showMobileOverlay && styles.tocCollapsibleMobileOpen,
          className,
        )}>
        <CollapseButton collapsed={collapsed} onClick={handleToggle} />
        <Collapsible
          lazy
          className={styles.tocCollapsibleContent}
          collapsed={collapsed}>
          <TocPageTitle />
          <TOCItems
            toc={tocWithoutH1}
            minHeadingLevel={minHeadingLevel}
            maxHeadingLevel={maxHeadingLevel}
          />
        </Collapsible>
      </div>
    </>
  );
}
