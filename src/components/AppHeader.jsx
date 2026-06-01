import { BookOpen, Grid3X3, Download, Bookmark, CornerUpLeft, Upload, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TOTAL = 38;

export default function AppHeader({ view, setView, placedCount, onOpenBulkUpload, onBookmark, onGoToBookmark, bookmark, bookmarkChapter }) {

  const progress = Math.round((placedCount / TOTAL) * 100);



  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-parchment border-b border-amber-200 shadow-sm">
      <div className="max-w-3xl mx-auto px-4 py-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h1 className="text-base font-bold text-amber-900 leading-tight">
              Jackie Roo &amp; The Rainy Day Robots
            </h1>
            <p className="text-xs text-amber-700">Image Placer · by Amber Dawn</p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={onBookmark} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors" title="Bookmark here">
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bookmark</span>
            </button>
            {bookmark !== null && (
              <button onClick={onGoToBookmark} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-amber-800 hover:bg-amber-900 text-white transition-colors" title="Go to bookmark">
                <CornerUpLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{bookmarkChapter ? `↩ ${bookmarkChapter}` : '↩ Resume'}</span>
              </button>
            )}
            <Link to="/assets" className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-700 text-white transition-colors font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Assets
            </Link>
            <Link to="/reader" className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              Read
            </Link>
            <button onClick={onOpenBulkUpload} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors font-medium">
              <Upload className="w-3.5 h-3.5" />
              Bulk Upload
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-amber-700 font-medium whitespace-nowrap">{placedCount}/{TOTAL} placed</span>
        </div>

        {/* View switcher */}
        <div className="flex gap-1 mt-2">
          {[
            { id: 'book',    label: 'Book',    Icon: BookOpen },
            { id: 'gallery', label: 'Gallery', Icon: Grid3X3 },
            { id: 'export',  label: 'Export',  Icon: Download },
          ].map(({ id, label, Icon: ViewIcon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full transition-colors ${
                view === id ? 'bg-amber-800 text-white' : 'text-amber-700 hover:bg-amber-100'
              }`}
            >
              <ViewIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}