import { useRef, useState, useEffect, useCallback } from 'react';
import { Upload, X, GripHorizontal } from 'lucide-react';

export default function BulkUploadModal({ onUpload, onClose }) {
  const [pos, setPos] = useState(null); // null = centered via CSS
  const [files, setFiles] = useState([]);
  const [draggingOver, setDraggingOver] = useState(false);
  const dragOrigin = useRef(null);
  const fileRef = useRef(null);

  // Panel dragging
  const onHeaderMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = e.currentTarget.closest('.bulk-modal')?.getBoundingClientRect();
    const px = rect ? rect.left : (window.innerWidth / 2 - 180);
    const py = rect ? rect.top : 100;
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px, py };
    if (!pos) setPos({ x: px, y: py });

    const onMouseMove = (ev) => {
      const dx = ev.clientX - dragOrigin.current.mx;
      const dy = ev.clientY - dragOrigin.current.my;
      setPos({ x: dragOrigin.current.px + dx, y: dragOrigin.current.py + dy });
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [pos]);

  // File drop zone
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (dropped.length) setFiles(prev => [...prev, ...dropped]);
  };

  const handleFileInput = (e) => {
    const picked = Array.from(e.target.files);
    if (picked.length) setFiles(prev => [...prev, ...picked]);
    e.target.value = '';
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    onUpload(files);
    onClose();
  };

  const posStyle = pos
    ? { left: pos.x, top: pos.y }
    : { left: '50%', top: '120px', transform: 'translateX(-50%)' };

  return (
    <div
      className="bulk-modal fixed z-50 w-80 bg-white rounded-xl shadow-2xl border border-amber-200 select-none"
      style={posStyle}
    >
      {/* Header / drag handle */}
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-amber-700 rounded-t-xl cursor-grab active:cursor-grabbing"
        onMouseDown={onHeaderMouseDown}
      >
        <div className="flex items-center gap-2 text-white">
          <GripHorizontal className="w-4 h-4 opacity-70" />
          <span className="text-sm font-semibold">Bulk Upload</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Drop zone */}
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingOver(true); }}
          onDragLeave={() => setDraggingOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
            draggingOver ? 'border-amber-500 bg-amber-50' : 'border-amber-300 hover:bg-amber-50'
          }`}
        >
          <Upload className="w-6 h-6 text-amber-400" />
          <p className="text-xs text-amber-600 text-center">
            Drop images here or <span className="font-semibold underline">browse</span>
          </p>
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileInput} />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between text-xs bg-amber-50 rounded px-2 py-1">
                <span className="truncate text-amber-800 max-w-[200px]">{f.name}</span>
                <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-amber-400 hover:text-red-500 ml-1 flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={files.length === 0}
          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {files.length === 0 ? 'Select images first' : `Upload ${files.length} image${files.length > 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}