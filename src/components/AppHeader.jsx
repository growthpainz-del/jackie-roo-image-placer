import { useRef } from "react";
import { BookOpen, Grid3X3, Download, Upload, Bookmark, CornerUpLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader({
  view, setView, placedCount, totalSlots,
  onBulkUpload, bulkUploading,
  bookmark, onBookmark, onGoToBookmark
}) {
  const fileRef = useRef();
  const pct = Math.round((placedCount / totalSlots) * 100);

  const handleFiles = (e) => {
    if (e.target.files?.length) onBulkUpload(e.target.files);
    e.target.value = "";
  };

  const bookTitle = "Jackie Roo \u0026 The Rainy Day Robots";

  return (
    <header className="sticky top-0 z-50 bg-amber-900 text-amber-50 shadow-lg">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight truncate">
              {bookTitle}
            </h1>
            <p className="text-amber-300 text-xs">Image Placer &middot; by Amber Dawn</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <Button
              size="sm"
              variant="ghost"
              className="text-amber-100 hover:bg-amber-800 h-7 px-2 text-xs"
              onClick={onBookmark}
              title="Bookmark current scroll position"
            >
              <Bookmark className="w-3 h-3 mr-1" />
              Bookmark
            </Button>
            {bookmark && (
              <Button
                size="sm"
                variant="ghost"
                className="text-amber-200 hover:bg-amber-800 h-7 px-2 text-xs"
                onClick={onGoToBookmark}
              >
                <CornerUpLeft className="w-3 h-3 mr-1" />
                Return
              </Button>
            )}
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white h-7 px-2 text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={bulkUploading}
            >
              {bulkUploading ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Upload className="w-3 h-3 mr-1" />
              )}
              Bulk Upload
            </Button>
            <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFiles} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 bg-amber-800 rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-amber-200 whitespace-nowrap">
            {placedCount}/{totalSlots} placed
          </span>
        </div>

        {/* View tabs */}
        <div className="flex gap-1">
          {[
            { id: "book", icon: BookOpen, label: "Book" },
            { id: "gallery", icon: Grid3X3, label: "Gallery" },
            { id: "export", icon: Download, label: "Export" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition-colors ${
                view === id
                  ? "bg-amber-100 text-amber-900"
                  : "text-amber-300 hover:text-amber-100 hover:bg-amber-800"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}