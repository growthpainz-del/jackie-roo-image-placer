import { BookOpen, Grid3X3, Download, Bookmark, CornerUpLeft, Upload, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TOTAL = 47;

export default function AppHeader({ view, setView, placedCount, onOpenBulkUpload, onBookmark, onGoToBookmark, bookmark, bookmarkChapter, onOpenProofReader }) {

  const progress = Math.round((placedCount / TOTAL) * 100);



  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-parchment border-b border-amber-200 shadow-sm">
      <div className="max-w-3xl mx-auto px-3 py-2">
        {/* Row 1: title + buttons */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-bold text-amber-900 leading-tight truncate shrink min-w-0">
            Jackie Roo &amp; The Rainy Day Robots
          </h1>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={onBookmark} className="p-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors" title="Bookmark">
              <Bookmark className="w-3.5 h-3.5" />
            </button>
            {bookmark !== null && (
              <button onClick={onGoToBookmark} className="p-1.5 rounded bg-amber-800 hover:bg-amber-900 text-white transition-colors" title="Go to bookmark">
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <Link to="/assets" className="p-1.5 rounded bg-violet-600 hover:bg-violet-700 text-white transition-colors" title="Assets">
              <Sparkles className="w-3.5 h-3.5" />
            </Link>
            <Link to="/reader" className="p-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors" title="Read">
              <BookOpen className="w-3.5 h-3.5" />
            </Link>
            <button onClick={onOpenProofReader} className="p-1.5 rounded bg-violet-600 hover:bg-violet-700 text-white transition-colors" title="Proof">
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button onClick={onOpenBulkUpload} className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors" title="Upload">
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: progress + view switcher */}
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex gap-1">
            {[
              { id: 'book',    label: 'Book',    Icon: BookOpen },
              { id: 'gallery', label: 'Gallery', Icon: Grid3X3 },
              { id: 'export',  label: 'Export',  Icon: Download },
            ].map(({ id, label, Icon: ViewIcon }) => (
              <button
                key={id}
                onClick={() => setView(id)}
                className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${
                  view === id ? 'bg-amber-800 text-white' : 'text-amber-700 hover:bg-amber-100'
                }`}
              >
                <ViewIcon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-amber-700 font-medium whitespace-nowrap">{placedCount}/{TOTAL}</span>
        </div>
      </div>
    </header>
  );
}