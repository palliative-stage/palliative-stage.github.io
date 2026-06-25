import React, { useCallback, useEffect, useRef, useState, } from "react";
import clsx from "clsx";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import ExecutionEnvironment from "@docusaurus/ExecutionEnvironment";
import { useHistory, useLocation } from "@docusaurus/router";
import { translate } from "@docusaurus/Translate";
import { ReactContextError, useDocsPreferredVersion, } from "@docusaurus/theme-common";
import { useActivePlugin } from "@docusaurus/plugin-content-docs/client";
import { fetchIndexes } from "@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/fetchIndexes";
import { SearchSourceFactory } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/SearchSourceFactory";
import { SuggestionTemplate } from "@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/SuggestionTemplate";
import { EmptyTemplate } from "@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/EmptyTemplate";
import { searchResultLimits, Mark, searchBarShortcut, searchBarShortcutHint, searchBarPosition, docsPluginIdForPreferredVersion, indexDocs, searchContextByPaths, } from "@easyops-cn/docusaurus-search-local/dist/client/client/utils/proxiedGenerated";
import LoadingRing from "@easyops-cn/docusaurus-search-local/dist/client/client/theme/LoadingRing/LoadingRing";
import styles from "@easyops-cn/docusaurus-search-local/dist/client/client/theme/SearchBar/SearchBar.module.css";
import "@easyops-cn/docusaurus-search-local/dist/client/client/utils/proxiedGenerated";
import { placeRtlSearchCaret } from "@site/src/lib/rtlSearchInput";
async function fetchAutoCompleteJS() {
    const autoCompleteModule = await import("@easyops-cn/autocomplete.js");
    const autoComplete = autoCompleteModule.default;
    if (autoComplete.noConflict) {
        // For webpack v5 since docusaurus v2.0.0-alpha.75
        autoComplete.noConflict();
    }
    else if (autoCompleteModule.noConflict) {
        // For webpack v4 before docusaurus v2.0.0-alpha.74
        autoCompleteModule.noConflict();
    }
    return autoComplete;
}
const SEARCH_PARAM_HIGHLIGHT = "_highlight";

function SearchMagnifierIcon() {
    return (<svg className="hebrew-search-bar__icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="currentColor" d="M6.02945,10.20327a4.17382,4.17382,0,1,1,4.17382-4.17382A4.15609,4.15609,0,0,1,6.02945,10.20327Zm9.69195,4.2199L10.8989,9.59979A5.88021,5.88021,0,0,0,12.058,6.02856,6.00467,6.00467,0,1,0,9.59979,10.8989l4.82338,4.82338a.89729.89729,0,0,0,1.29912,0,.89749.89749,0,0,0-.00087-1.29909Z"/>
    </svg>);
}

export default function SearchBar({ handleSearchBarToggle, }) {
    const { siteConfig: { baseUrl }, i18n } = useDocusaurusContext();
    const isHebrew = i18n.currentLocale === "he";
    // It returns undefined for non-docs pages
    const activePlugin = useActivePlugin();
    let versionUrl = baseUrl;
    // For non-docs pages while using plugin-content-docs with custom ids,
    // this will throw an error of:
    //   > Docusaurus plugin global data not found for "docusaurus-plugin-content-docs" plugin with id "default".
    // It seems that we can not get the correct id for non-docs pages.
    try {
        // The try-catch is a hack because useDocsPreferredVersion just throws an
        // exception when versions are not used.
        // The same hack is used in SearchPage.tsx
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { preferredVersion } = useDocsPreferredVersion(activePlugin?.pluginId ?? docsPluginIdForPreferredVersion);
        if (preferredVersion && !preferredVersion.isLast) {
            versionUrl = preferredVersion.path + "/";
        }
    }
    catch (e) {
        if (indexDocs) {
            if (e instanceof ReactContextError) {
                /* ignore, happens when website doesn't use versions */
            }
            else {
                throw e;
            }
        }
    }
    const history = useHistory();
    const location = useLocation();
    const searchBarRef = useRef(null);
    const indexStateMap = useRef(new Map());
    // Should the input be focused after the index is loaded?
    const focusAfterIndexLoaded = useRef(false);
    const [loading, setLoading] = useState(false);
    const [inputChanged, setInputChanged] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const search = useRef(null);
    const prevSearchContext = useRef("");
    const [searchContext, setSearchContext] = useState("");
    useEffect(() => {
        if (!Array.isArray(searchContextByPaths)) {
            return;
        }
        let nextSearchContext = "";
        if (location.pathname.startsWith(versionUrl)) {
            const uri = location.pathname.substring(versionUrl.length);
            const matchedPath = searchContextByPaths.find((path) => uri === path || uri.startsWith(`${path}/`));
            if (matchedPath) {
                nextSearchContext = matchedPath;
            }
        }
        if (prevSearchContext.current !== nextSearchContext) {
            // Reset index state map once search context is changed.
            indexStateMap.current.delete(nextSearchContext);
            prevSearchContext.current = nextSearchContext;
        }
        setSearchContext(nextSearchContext);
    }, [location.pathname, versionUrl]);
    // Always show search — hiding when searchContext is empty caused the bar to vanish after hydration.
    const hidden = false;
    const loadIndex = useCallback(async () => {
        if (hidden || indexStateMap.current.get(searchContext)) {
            // Do not load the index (again) if its already loaded or in the process of being loaded.
            return;
        }
        indexStateMap.current.set(searchContext, "loading");
        search.current?.autocomplete.destroy();
        setLoading(true);
        const [{ wrappedIndexes, zhDictionary }, autoComplete] = await Promise.all([
            fetchIndexes(versionUrl, searchContext),
            fetchAutoCompleteJS(),
        ]);
        search.current = autoComplete(searchBarRef.current, {
            hint: false,
            autoselect: true,
            openOnFocus: true,
            cssClasses: {
                root: clsx(styles.searchBar, {
                    [styles.searchBarLeft]: searchBarPosition === "left",
                }),
                noPrefix: true,
                dropdownMenu: styles.dropdownMenu,
                input: styles.input,
                hint: styles.hint,
                suggestions: styles.suggestions,
                suggestion: styles.suggestion,
                cursor: styles.cursor,
                dataset: styles.dataset,
                empty: styles.empty,
            },
        }, [
            {
                source: SearchSourceFactory(wrappedIndexes, zhDictionary, searchResultLimits),
                templates: {
                    suggestion: SuggestionTemplate,
                    empty: EmptyTemplate,
                    footer: ({ query, isEmpty }) => {
                        if (isEmpty) {
                            return;
                        }
                        const a = document.createElement("a");
                        const url = `${baseUrl}search?q=${encodeURIComponent(query)}${Array.isArray(searchContextByPaths)
                            ? `&ctx=${encodeURIComponent(searchContext)}`
                            : ""}`;
                        a.href = url;
                        a.textContent = translate({
                            id: "theme.SearchBar.seeAll",
                            message: "See all results",
                        });
                        a.addEventListener("click", (e) => {
                            if (!e.ctrlKey && !e.metaKey) {
                                e.preventDefault();
                                search.current?.autocomplete.close();
                                history.push(url);
                            }
                        });
                        const div = document.createElement("div");
                        div.className = styles.hitFooter;
                        div.appendChild(a);
                        return div;
                    },
                },
            },
        ])
            .on("autocomplete:selected", function (event, { document: { u, h }, tokens, type }) {
            searchBarRef.current?.blur();
            let url = u;
            // Page-title hits (type 0, no section hash): navigate cleanly — no in-page highlighting.
            const isPageTitleHit = type === 0 || !h;
            if (Mark && tokens.length > 0 && !isPageTitleHit) {
                const params = new URLSearchParams();
                for (const token of tokens) {
                    params.append(SEARCH_PARAM_HIGHLIGHT, token);
                }
                url += `?${params.toString()}`;
            }
            if (h) {
                url += h;
            }
            history.push(url);
        })
            .on("autocomplete:closed", () => {
            searchBarRef.current?.blur();
        });
        indexStateMap.current.set(searchContext, "done");
        setLoading(false);
        if (focusAfterIndexLoaded.current) {
            const input = searchBarRef.current;
            if (input.value) {
                search.current?.autocomplete.open();
            }
            input.focus();
            if (isHebrew) {
                placeRtlSearchCaret(input);
                window.setTimeout(() => placeRtlSearchCaret(input), 100);
            }
        }
    }, [hidden, searchContext, versionUrl, baseUrl, history, isHebrew]);
    useEffect(() => {
        if (!Mark) {
            return;
        }
        const keywords = ExecutionEnvironment.canUseDOM
            ? new URLSearchParams(location.search).getAll(SEARCH_PARAM_HIGHLIGHT)
            : [];
        const hasSectionHash = Boolean(location.hash && location.hash.length > 1);
        // Page-title navigation should not highlight or sync hidden terms into the navbar input.
        if (!hasSectionHash) {
            if (keywords.length !== 0) {
                const params = new URLSearchParams(location.search);
                params.delete(SEARCH_PARAM_HIGHLIGHT);
                const paramsStr = params.toString();
                const cleanUrl =
                    location.pathname + (paramsStr ? `?${paramsStr}` : "") + location.hash;
                if (cleanUrl !== location.pathname + location.search + location.hash) {
                    history.replace(cleanUrl);
                }
            }
            setInputValue("");
            search.current?.autocomplete.setVal("");
            return;
        }
        // A workaround to fix an issue of highlighting in code blocks.
        // See https://github.com/easyops-cn/docusaurus-search-local/issues/92
        // Code blocks will be re-rendered after this `useEffect` ran.
        // So we make the marking run after a macro task.
        setTimeout(() => {
            const root = document.querySelector(".theme-doc-markdown");
            if (!root) {
                return;
            }
            const mark = new Mark(root);
            mark.unmark();
            if (keywords.length !== 0) {
                mark.mark(keywords);
            }
            setInputValue(keywords.join(" "));
            search.current?.autocomplete.setVal(keywords.join(" "));
        });
    }, [location.search, location.pathname, location.hash, history]);
    const [focused, setFocused] = useState(false);
    const onInputFocus = useCallback(() => {
        focusAfterIndexLoaded.current = true;
        loadIndex();
        setFocused(true);
        handleSearchBarToggle?.(true);
        if (isHebrew) {
            placeRtlSearchCaret(searchBarRef.current);
        }
    }, [handleSearchBarToggle, loadIndex, isHebrew]);
    const onInputBlur = useCallback(() => {
        setFocused(false);
        handleSearchBarToggle?.(false);
    }, [handleSearchBarToggle]);
    const onInputMouseEnter = useCallback(() => {
        loadIndex();
    }, [loadIndex]);
    const onInputChange = useCallback((event) => {
        setInputValue(event.target.value);
        if (event.target.value) {
            setInputChanged(true);
        }
        if (isHebrew) {
            placeRtlSearchCaret(event.target);
        }
    }, [isHebrew]);
    // Implement hint icons for the search shortcuts on mac and the rest operating systems.
    const isMac = ExecutionEnvironment.canUseDOM
        ? /mac/i.test(navigator.userAgentData?.platform ?? navigator.platform)
        : false;
    useEffect(() => {
        if (!searchBarShortcut) {
            return;
        }
        // Add shortcuts command/ctrl + K
        const handleShortcut = (event) => {
            if ((isMac ? event.metaKey : event.ctrlKey) && event.code === "KeyK") {
                event.preventDefault();
                onInputFocus();
                searchBarRef.current?.focus();
                if (isHebrew) {
                    placeRtlSearchCaret(searchBarRef.current);
                }
            }
        };
        document.addEventListener("keydown", handleShortcut);
        return () => {
            document.removeEventListener("keydown", handleShortcut);
        };
    }, [isMac, onInputFocus, isHebrew]);
    const onClearSearch = useCallback(() => {
        const params = new URLSearchParams(location.search);
        params.delete(SEARCH_PARAM_HIGHLIGHT);
        const paramsStr = params.toString();
        const searchUrl = location.pathname +
            (paramsStr != "" ? `?${paramsStr}` : "") +
            location.hash;
        if (searchUrl != location.pathname + location.search + location.hash) {
            history.push(searchUrl);
        }
        setInputValue("");
        search.current?.autocomplete.setVal("");
        if (Mark) {
            const root = document.querySelector(".theme-doc-markdown");
            if (root) {
                new Mark(root).unmark();
            }
        }
    }, [location.pathname, location.search, location.hash, history]);
    const searchInputProps = {
        placeholder: isHebrew
            ? "חיפוש"
            : translate({
                id: "theme.SearchBar.label",
                message: "Search",
                description: "The ARIA label and placeholder for search button",
            }),
        "aria-label": isHebrew ? "חיפוש" : "Search",
        dir: isHebrew ? "rtl" : undefined,
        className: clsx("navbar__search-input", isHebrew && "hebrew-search-bar__input", inputValue && "navbar__search-input--has-query"),
        onMouseEnter: onInputMouseEnter,
        onFocus: onInputFocus,
        onBlur: onInputBlur,
        onChange: onInputChange,
        ref: searchBarRef,
        value: inputValue,
    };

    if (isHebrew) {
        const showLoading = loading && inputChanged;
        const hasQuery = inputValue !== "";
        const showLeading = !showLoading && !hasQuery && !focused;
        return (<div className={clsx("navbar__search", "hebrew-search-bar", styles.searchBarContainer, {
                [styles.searchIndexLoading]: showLoading,
                [styles.focused]: focused,
                "hebrew-search-bar--focused": focused,
                "hebrew-search-bar--has-query": hasQuery,
            })} hidden={hidden} style={{ direction: "ltr", unicodeBidi: "isolate" }}>
        <div className="hebrew-search-bar__shell">
          <input {...searchInputProps} style={{ direction: "rtl", textAlign: "right" }}/>
          {showLoading ? (<LoadingRing className={clsx(styles.searchBarLoadingRing, "hebrew-search-bar__loading")}/>) : hasQuery ? (<button type="button" className="hebrew-search-bar__clear" onClick={onClearSearch} aria-label="נקה חיפוש">
              ✕
            </button>) : showLeading ? (<div className="hebrew-search-bar__leading" aria-hidden="true">
              <SearchMagnifierIcon />
              <div className="hebrew-search-bar__keys">
                <kbd>{isMac ? "⌘" : "ctrl"}</kbd>
                <kbd>K</kbd>
              </div>
            </div>) : null}
        </div>
      </div>);
    }

    return (<div className={clsx("navbar__search", styles.searchBarContainer, {
            [styles.searchIndexLoading]: loading && inputChanged,
            [styles.focused]: focused,
        })} hidden={hidden}>
      <input {...searchInputProps}/>
      <LoadingRing className={styles.searchBarLoadingRing}/>
      {searchBarShortcut &&
            searchBarShortcutHint &&
            (inputValue !== "" ? (<button type="button" className={styles.searchClearButton} onClick={onClearSearch}>
            ✕
          </button>) : (<div className={styles.searchHintContainer}>
            <kbd className={styles.searchHint}>{isMac ? "⌘" : "ctrl"}</kbd>
            <kbd className={styles.searchHint}>K</kbd>
          </div>))}
    </div>);
}
