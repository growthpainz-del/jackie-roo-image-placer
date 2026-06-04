import { useState, useRef } from 'react';
import { SLOT_CONFIG, CHAPTER_META } from '@/lib/slotConfig';
import { Upload, X, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CHAPTERS = [...new Set(SLOT_CONFIG.map(s => s.chapter))];
const MIN_DIM = 4096;

function PreviewModal({ url, label, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-8 right-0 text-white/70 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <img src={url} alt={label} className="w-full rounded-xl object-contain max-h-[80vh]" />
        <p className="text-white/60 text-xs mt-2 text-center leading-snug">{label}</p>
      </div>
    </div>
  );
}

function SlotRow({ slot, illustration, onUpload, onRemove }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [imgDims, setImgDims] = useState(null);

  const hasImage = !!illustration?.image_url;
  const isLowRes = imgDims ? (imgDims.w < MIN_DIM || imgDims.h < MIN_DIM) : false;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(slot.slot_id, file);
    setUploading(false);
    e.target.value = '';
  };

  return (
    <>
      <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg border transition-colors ${
        hasImage ? 'border-emerald-200 bg-white' : 'border-amber-200 bg-amber-50/40'
      }`}>
        {/* Thumbnail or upload button */}
        <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-amber-100 flex items-center justify-center relative">
          {hasImage ? (
            <>
              <img
                src={`${illustration.image_url}?w=96`}
                alt={slot.label}
                className="w-full h-full object-cover"
                loading="lazy"
                onLoad={e => setImgDims({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
              />
              {/* low-res dot */}
              {imgDims && (
                <div className={`absolute bottom-0.5 right-0.5 rounded-full w-3 h-3 flex items-center justify-center ${isLowRes ? 'bg-red-500' : 'bg-emerald-500'}`}>
                  {isLowRes
                    ? <AlertTriangle className="w-2 h-2 text-white" />
                    : <CheckCircle2 className="w-2 h-2 text-white" />}
                </div>
              )}
            </>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full h-full flex items-center justify-center hover:bg-amber-200 transition-colors">
              {uploading
                ? <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                : <Upload className="w-4 h-4 text-amber-400" />}
            </button>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-mono text-amber-600 leading-none mb-0.5">{slot.slot_id}</p>
          <p className="text-xs text-gray-700 leading-snug line-clamp-2">{slot.label}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasImage && (
            <>
              <button onClick={() => setPreview(true)} className="p-1.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-700 transition-colors">
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onRemove(slot.slot_id)} className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {!hasImage && (
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors">
              Upload
            </button>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {preview && <PreviewModal url={illustration.image_url} label={slot.label} onClose={() => setPreview(false)} />}
    </>
  );
}

export default function GalleryView({ illustrationMap, onUpload, onRemove }) {
  return (
    <div className="space-y-8">
      {CHAPTERS.map(chapterKey => {
        const slots = SLOT_CONFIG.filter(s => s.chapter === chapterKey);
        const meta = CHAPTER_META[chapterKey];
        const placed = slots.filter(s => illustrationMap[s.slot_id]?.image_url).length;
        return (
          <section key={chapterKey} data-chapter={chapterKey}>
            <div className="flex items-baseline gap-3 mb-3 pb-2 border-b border-amber-200">
              <h2 className="text-sm font-bold text-amber-900">{meta?.title || chapterKey}</h2>
              <span className="text-xs text-amber-600 hidden sm:inline">{meta?.subtitle}</span>
              <span className="ml-auto text-xs text-amber-500">{placed}/{slots.length}</span>
            </div>
            <div className="space-y-1.5">
              {slots.map(slot => (
                <SlotRow
                  key={slot.slot_id}
                  slot={slot}
                  illustration={illustrationMap[slot.slot_id]}
                  onUpload={onUpload}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}