import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { BOOK_CHAPTERS } from '@/lib/bookContent';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export default function Reader() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dragStart, setDragStart] = useState(null);

  const { data: illustrations = [] } = useQuery({
    queryKey: ['illustrations'],
    queryFn: () => base44.entities.Illustration.list(),
  });
  const illustrationMap = Object.fromEntries(illustrations.map(i => [i.slot_id, i]));

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
        <Link to="/" className="text-amber-400 hover:text-amber-200 transition-colors">
          <X className="w-5 h-5" />
        </Link>
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
              <SlotPage page={page} illustration={illustration} />
            ) : (
              <TextPage page={page} />
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
    </div>
  );
}

function SlotPage({ page, illustration }) {
  const hasImage = illustration?.image_url;
  const isReveal = page.slot_id?.includes('-reveal') || page.slot_id?.includes('finale-backyard');

  return (
    <div className="w-full max-w-2xl flex flex-col items-center gap-4 h-full justify-center">
      {/* Image area */}
      <div className={`w-full flex-1 max-h-[60vh] rounded-xl overflow-hidden flex items-center justify-center ${
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

function TextPage({ page }) {
  return (
    <div className="w-full max-w-xl text-center">
      <p className="text-amber-50 font-book text-lg sm:text-xl leading-relaxed whitespace-pre-line">
        {page.content}
      </p>
    </div>
  );
}