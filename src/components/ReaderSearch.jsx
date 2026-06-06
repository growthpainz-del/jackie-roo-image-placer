import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

// Build list of all text-page matches across the manuscript
function findMatches(pages, query) {
  if (!query || query.trim().length < 2) return [];
  const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const results = [];
  pages.forEach((page, pageIndex) => {
    if (page.type !== 'text') return;
    const text = page.content || '';
    let m;
    while ((m = re.exec(text)) !== null) {
      results.push({ pageIndex, offset: m.index, length: m[0].length });
    }
  });
  return results;
}

// Highlight matches in a text string, returning an array of React nodes
export function highlightText(text, query) {
  if (!query || query.trim().length < 2) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part)
      ? <mark key={i} className="bg-amber-400 text-gray-900 rounded px-0.5">{part}</mark>
      : part
  );
}

export default function ReaderSearch({ pages, currentIndex, onNavigate, onQueryChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [matchCursor, setMatchCursor] = useState(0);
  const inputRef = useRef(null);

  const matches = findMatches(pages, query);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Reset cursor and propagate query changes
  useEffect(() => {
    setMatchCursor(0);
    onQueryChange?.(query);
  }, [query]);

  const navigate = (delta) => {
    if (!matches.length) return;
    const next = (matchCursor + delta + matches.length) % matches.length;
    setMatchCursor(next);
    onNavigate(matches[next].pageIndex);
  };

  // Count how many matches are on the current page
  const matchesOnPage = matches.filter(m => m.pageIndex === currentIndex).length;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`transition-colors ${open ? 'text-amber-200' : 'text-amber-400 hover:text-amber-200'}`}
        title="Search manuscript"
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Search panel */}
      {open && (
        <div
          className="absolute top-full left-0 right-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-700 px-4 py-2.5 flex items-center gap-2"
          onMouseDown={e => e.stopPropagation()}
        >
          <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') navigate(e.shiftKey ? -1 : 1);
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="Search text…"
            className="flex-1 bg-transparent text-amber-50 placeholder-gray-600 text-sm outline-none"
          />
          {query && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {matches.length === 0
                ? 'No results'
                : `${matches.length} match${matches.length !== 1 ? 'es' : ''}${matchesOnPage > 0 ? ` · ${matchesOnPage} here` : ''}`}
            </span>
          )}
          <button onClick={() => navigate(-1)} disabled={!matches.length} className="text-amber-400 hover:text-amber-200 disabled:text-gray-700 transition-colors">
            <ChevronUp className="w-4 h-4" />
          </button>
          <button onClick={() => navigate(1)} disabled={!matches.length} className="text-amber-400 hover:text-amber-200 disabled:text-gray-700 transition-colors">
            <ChevronDown className="w-4 h-4" />
          </button>
          <button onClick={() => { setOpen(false); setQuery(''); onQueryChange?.(''); }} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}