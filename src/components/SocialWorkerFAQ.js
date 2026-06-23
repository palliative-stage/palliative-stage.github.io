import React, { useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import faqData from '@site/src/data/social-worker-faq.json';
import { placeRtlSearchCaret } from '@site/src/lib/rtlSearchInput';
import '@site/src/css/social-worker-faq.css';

const ALL_CATEGORY = 'all';

function normalizeForSearch(text) {
	return (text || '').toLowerCase().trim();
}

function itemMatchesQuery(item, query) {
	if (!query) return true;
	const haystack = [
		item.topic,
		item.question,
		item.answer,
		...item.subQuestions.flatMap((s) => [s.question, s.answer]),
	]
		.map(normalizeForSearch)
		.join(' ');
	return haystack.includes(query);
}

function FaqAccordionItem({ item, isOpen, onToggle }) {
	const panelId = `faq-panel-${item.id}`;
	const headerId = `faq-header-${item.id}`;

	return (
		<div className="sw-faq__item">
			<button
				type="button"
				id={headerId}
				className="sw-faq__item-header"
				aria-expanded={isOpen}
				aria-controls={panelId}
				onClick={onToggle}
			>
				<span className="sw-faq__item-meta">
					<span className="sw-faq__topic">{item.topic}</span>
				</span>
				<span className="sw-faq__question">{item.question}</span>
				<span className={clsx('sw-faq__chevron', isOpen && 'sw-faq__chevron--open')} aria-hidden="true">
					▼
				</span>
			</button>
			{isOpen && (
				<div id={panelId} role="region" aria-labelledby={headerId} className="sw-faq__item-body">
					<p className="sw-faq__answer">{item.answer}</p>
					{item.subQuestions.length > 0 && (
						<div className="sw-faq__sub-list">
							{item.subQuestions.map((sub, idx) => (
								<div key={idx} className="sw-faq__sub-item">
									<p className="sw-faq__sub-question">{sub.question}</p>
									<p className="sw-faq__sub-answer">{sub.answer}</p>
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export default function SocialWorkerFAQ() {
	const { meta, categories, items } = faqData;
	const [query, setQuery] = useState('');
	const [categoryId, setCategoryId] = useState(ALL_CATEGORY);
	const [openIds, setOpenIds] = useState(() => new Set());
	const searchRef = useRef(null);

	const normalizedQuery = normalizeForSearch(query);

	const filteredItems = useMemo(() => {
		return items
			.filter((item) => categoryId === ALL_CATEGORY || item.categoryId === categoryId)
			.filter((item) => itemMatchesQuery(item, normalizedQuery))
			.sort((a, b) => b.frequency - a.frequency);
	}, [items, categoryId, normalizedQuery]);

	const categoryCounts = useMemo(() => {
		const counts = { [ALL_CATEGORY]: items.length };
		for (const cat of categories) {
			counts[cat.id] = items.filter((i) => i.categoryId === cat.id).length;
		}
		return counts;
	}, [items, categories]);

	const toggleItem = (id) => {
		setOpenIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const handleSearchFocus = () => {
		if (searchRef.current) placeRtlSearchCaret(searchRef.current);
	};

	return (
		<div className="sw-faq" dir="rtl">
			<p className="sw-faq__intro">
				מאגר שאלות ותשובות לעובדים סוציאליים בטיפול פליאטיבי – מסודר לפי נושאים.
			</p>

			<div className="sw-faq__disclaimer" role="note">
				<strong>חשוב:</strong> {meta.disclaimer}
			</div>

			<div className="sw-faq__search-wrap">
				<label className="sw-faq__search-label" htmlFor="sw-faq-search">
					חיפוש בשאלות ותשובות
				</label>
				<input
					ref={searchRef}
					id="sw-faq-search"
					type="search"
					className="sw-faq__search"
					dir="rtl"
					placeholder="הקלידו מילת חיפוש..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={handleSearchFocus}
					autoComplete="off"
				/>
			</div>

			<div className="sw-faq__chips" role="group" aria-label="סינון לפי קטגוריה">
				<button
					type="button"
					className={clsx('sw-faq__chip', categoryId === ALL_CATEGORY && 'sw-faq__chip--active')}
					onClick={() => setCategoryId(ALL_CATEGORY)}
				>
					הכל
					<span className="sw-faq__chip-count">{categoryCounts[ALL_CATEGORY]}</span>
				</button>
				{categories.map((cat) => (
					<button
						key={cat.id}
						type="button"
						className={clsx('sw-faq__chip', categoryId === cat.id && 'sw-faq__chip--active')}
						onClick={() => setCategoryId(cat.id)}
					>
						{cat.label}
						<span className="sw-faq__chip-count">{categoryCounts[cat.id] || 0}</span>
					</button>
				))}
			</div>

			<p className="sw-faq__results-count" aria-live="polite">
				מציג {filteredItems.length} מתוך {items.length}
			</p>

			{filteredItems.length === 0 ? (
				<p className="sw-faq__empty">לא נמצאו תוצאות. נסו מילת חיפוש אחרת או בחרו קטגוריה אחרת.</p>
			) : (
				<div className="sw-faq__list">
					{filteredItems.map((item) => (
						<FaqAccordionItem
							key={item.id}
							item={item}
							isOpen={openIds.has(item.id)}
							onToggle={() => toggleItem(item.id)}
						/>
					))}
				</div>
			)}
		</div>
	);
}
