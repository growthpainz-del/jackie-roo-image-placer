import { useState, useCallback } from 'react';
import PDFExportModal from '@/components/PDFExportModal';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { BOOK_CHAPTERS } from '@/lib/bookContent';
import { ChevronLeft, ChevronRight, BookOpen, Download, Flag, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import FlagPanel from '@/components/FlagPanel';
import { MOOD_MAP } from '@/components/BeatTagger';

// Flatten all blocks, skipping pageturns, tagging with chapter info
const PAGES = [];
BOOK_CHAPTERS.forEach((ch) => {
  ch.blocks.forEach((block) => {
    if (block.type === 'pageturn') return;
    PAGES.push({ ...block, chapterTitle: ch.title, chapterSubtitle: ch.subtitle, chapterId: ch.id });
  });
});

const variants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

// Build page index lookup by block_ref (slot_id or chapter:text:blockIndex pattern)
const PAGE_INDEX_BY_REF = {};
PAGES.forEach((p, i) => {
  if (p.slot_id) PAGE_INDEX_BY_REF[p.slot_id] = i;
});

export default function Reader() {
  const initialIndex = (() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('page');
    return p !== null ? Math.max(0, Math.min(PAGES.length - 1, Number(p))) : 0;
  })();
  const [index, setIndex] = useState(initialIndex);
  const [direction, setDirection] = useState(1);
  const [dragStart, setDragStart] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [showFlags, setShowFlags] = useState(false);
  const navigate = useNavigate();

  const { data: flags = [] } = useQuery({
    queryKey: ['flags'],
    queryFn: () => base44.entities.Flag.list(),
  });
  const pageFlagCount = flags.filter(f => f.page_index === index && !f.resolved).length;
  const totalUnresolved = flags.filter(f => !f.resolved).length;

  const { data: illustrations = [] } = useQuery({
    queryKey: ['illustrations'],
    queryFn: () => base44.entities.Illustration.list(),
  });
  const illustrationMap = Object.fromEntries(illustrations.map(i => [i.slot_id, i]));

  const { data: beatTags = [] } = useQuery({
    queryKey: ['beat-tags'],
    queryFn: () => base44.entities.BeatTag.list(),
  });
  const beatMap = Object.fromEntries(beatTags.map(t => [t.block_ref, t]));

  const go = useCallback((dir) => {
    setDirection(dir);
    setIndex(i => Math.max(0, Math.min(PAGES.length - 1, i + dir)));
  }, []);

  const handleTouchStart = (e) => setDragStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (dragStart === null) return;
    const diff = dragStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1);
    setDragStart(null);
  };

  const handleMouseDown = (e) => setDragStart(e.clientX);
  const handleMouseUp = (e) => {
    if (dragStart === null) return;
    const diff = dragStart - e.clientX;
    if (Math.abs(diff) > 60) go(diff > 0 ? 1 : -1);
    setDragStart(null);
  };

  const page = PAGES[index];
  const illustration = page.type === 'slot' ? illustrationMap[page.slot_id] : null;
  const progress = Math.round(((index + 1) / PAGES.length) * 100);
  const beatTag = page.type === 'slot'
    ? beatMap[page.slot_id]
    : beatMap[`${page.chapterId}:text:${PAGES.slice(0, index).filter(p => p.chapterId === page.chapterId && p.type === 'text').length}`] || null;

  return (
    <div
      className="fixed inset-0 bg-gray-950 flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="text-xs text-amber-300 font-book">
          <span className="font-semibold">{page.chapterTitle}</span>
          <span className="text-amber-500 ml-2 hidden sm:inline">{page.chapterSubtitle}</span>
        </div>
        <div className="text-xs text-amber-500">{index + 1} / {PAGES.length}</div>
        <button
          onClick={() => setShowFlags(v => !v)}
          className="relative text-amber-400 hover:text-amber-200 transition-colors"
          title="Flag an issue"
        >
          <Flag className="w-4 h-4" />
          {pageFlagCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center">{pageFlagCount}</span>
          )}
        </button>
        <button onClick={() => setShowExport(true)} className="text-amber-400 hover:text-amber-200 transition-colors" title="Export PDF">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={() => navigate(-1)} className="text-amber-400 hover:text-amber-200 transition-colors" title="Go back">
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-800 flex-shrink-0">
        <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Page content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
          >
            {page.type === 'slot' ? (
              <SlotPage page={page} illustration={illustration} beatTag={beatTag} />
            ) : (
              <TextPage page={page} beatTag={beatTag} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="flex items-center gap-1 text-sm text-amber-300 disabled:text-gray-600 hover:text-amber-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Prev
        </button>
        <Link to="/" className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-400 transition-colors">
          <BookOpen className="w-4 h-4" /> Back to Placer
        </Link>
        <button
          onClick={() => go(1)}
          disabled={index === PAGES.length - 1}
          className="flex items-center gap-1 text-sm text-amber-300 disabled:text-gray-600 hover:text-amber-100 transition-colors"
        >
          Next <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      {showFlags && (
        <FlagPanel
          page={page}
          pageIndex={index}
          flags={flags}
          onClose={() => setShowFlags(false)}
        />
      )}
    {showExport && (
      <PDFExportModal illustrationMap={illustrationMap} onClose={() => setShowExport(false)} />
    )}
  </div>
  );
}

function BeatBadge({ beatTag }) {
  if (!beatTag) return null;
  const mood = MOOD_MAP[beatTag.mood];
  if (!mood) return null;
  return (
    <div
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold shadow-lg backdrop-blur-sm"
      style={{ backgroundColor: mood.color + 'cc' }}
    >
      <span className="text-base leading-none">{mood.emoji}</span>
      <span>{mood.label}</span>
      <span className="opacity-70">·</span>
      <span>{beatTag.intensity}/10</span>
      {beatTag.note && (
        <span className="opacity-70 italic max-w-[120px] truncate hidden sm:inline">— {beatTag.note}</span>
      )}
    </div>
  );
}

function SlotPage({ page, illustration, beatTag }) {
  const hasImage = illustration?.image_url;
  const isReveal = page.slot_id?.includes('-reveal') || page.slot_id?.includes('finale-backyard');

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-4 h-full justify-center">
      {/* Image area */}
      <div className={`relative w-full flex-1 max-h-[60vh] rounded-xl overflow-hidden flex items-center justify-center ${
        isReveal ? 'border-2 border-amber-700/40' : 'border border-gray-700'
      } bg-gray-900`}>
        {hasImage ? (
          <img
            src={illustration.image_url}
            alt={page.label}
            className="w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm max-w-xs">{page.label}</p>
          </div>
        )}
        {/* Beat badge overlaid on image */}
        {beatTag && (
          <div className="absolute bottom-3 left-3">
            <BeatBadge beatTag={beatTag} />
          </div>
        )}
      </div>

      {/* Caption */}
      {isReveal && (
        <div className="text-center">
          <span className="text-xs uppercase tracking-widest text-amber-700 font-semibold">Reveal</span>
        </div>
      )}
    </div>
  );
}

function TextPage({ page, beatTag }) {
  const mood = beatTag ? MOOD_MAP[beatTag.mood] : null;
  return (
    <div className="w-full max-w-xl flex flex-col items-center gap-5">
      {/* Emotional beat strip */}
      {mood && (
        <div
          className="w-full rounded-lg px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: mood.color + '22', borderLeft: `3px solid ${mood.color}` }}
        >
          <span className="text-2xl">{mood.emoji}</span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: mood.color }}>{mood.label} · {beatTag.intensity}/10</p>
            {beatTag.note && <p className="text-xs text-gray-400 italic mt-0.5">{beatTag.note}</p>}
          </div>
        </div>
      )}
      <p className="text-amber-50 font-book text-lg sm:text-xl leading-relaxed whitespace-pre-line text-center">
        {page.content}
      </p>
    </div>
  );
}