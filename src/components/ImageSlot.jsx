import { useRef, useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { normalizeDriveUrl } from '@/lib/driveUrl';
import { Upload, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

const MIN_DIM = 4096;

export default function ImageSlot({ slot, illustration, onUpload, onAssignFromTray, onRemove, selectedUnassigned, setSelectedUnassigned, layout }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [imgDims, setImgDims] = useState(null); // { w, h }

  const hasImage = !!illustration?.image_url;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(slot.slot_id, file);
    setUploading(false);
    e.target.value = '';
  };

  const handleSlotClick = () => {
    if (selectedUnassigned && !hasImage) {
      onAssignFromTray(slot.slot_id, selectedUnassigned);
    } else if (!hasImage) {
      fileRef.current?.click();
    }
  };

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImgDims({ w: naturalWidth, h: naturalHeight });
  };

  const isLowRes = imgDims ? (imgDims.w < MIN_DIM || imgDims.h < MIN_DIM) : false;

  if (layout === 'book') {
    return (
      <Droppable droppableId={slot.slot_id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`relative w-full rounded-xl border-2 transition-all ${
              snapshot.isDraggingOver ? 'border-amber-400 bg-amber-50 scale-[1.01]' :
              hasImage ? 'border-transparent' : 'border-dashed border-amber-300 bg-amber-50/50'
            }`}
          >
            {hasImage ? (
              <div className="relative group">
                <img
                  src={normalizeDriveUrl(illustration.image_url)}
                  alt={slot.label}
                  className="w-full object-cover rounded-xl overflow-hidden"
                  onLoad={handleImageLoad}
                />
                <button
                  onClick={() => onRemove(slot.slot_id)}
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-black/60 text-white rounded-full p-1 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {imgDims && (
                  <div className={`absolute bottom-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium shadow ${
                    isLowRes ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                  }`}>
                    {isLowRes ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    {imgDims.w}×{imgDims.h}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleSlotClick}
                disabled={uploading}
                className={`w-full min-h-[200px] flex flex-col items-center justify-center gap-2 p-6 text-center transition-colors ${
                  selectedUnassigned ? 'bg-amber-100 hover:bg-amber-200 cursor-pointer' : 'hover:bg-amber-100 cursor-pointer'
                }`}
              >
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-amber-400" />
                    <span className="text-xs text-amber-600 font-mono">{slot.slot_id}</span>
                    <span className="text-xs text-amber-500 max-w-[240px] leading-snug">{slot.label}</span>
                    {selectedUnassigned && <span className="text-xs text-emerald-600 font-medium mt-1">Tap to assign selected image</span>}
                  </>
                )}
              </button>
            )}
            {provided.placeholder}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        )}
      </Droppable>
    );
  }

  // Gallery layout
  return (
    <Droppable droppableId={slot.slot_id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-square ${
            snapshot.isDraggingOver ? 'border-amber-400 scale-[1.02]' :
            hasImage ? 'border-emerald-400' : 'border-dashed border-amber-300'
          }`}
        >
          {hasImage ? (
            <div className="relative group w-full h-full">
              <img src={normalizeDriveUrl(illustration.image_url)} alt={slot.label} className="w-full h-full object-cover" onLoad={handleImageLoad} />
              {imgDims && (
                <div className={`absolute bottom-1 left-0 right-0 mx-1 flex items-center justify-center gap-0.5 text-[9px] px-1 py-0.5 rounded font-bold ${
                  isLowRes ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'
                }`}>
                  {isLowRes ? <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> : <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                  {imgDims.w}×{imgDims.h}
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <button onClick={() => onRemove(slot.slot_id)} className="opacity-0 group-hover:opacity-100 bg-white/80 rounded-full p-1.5 transition-opacity">
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSlotClick}
              disabled={uploading}
              className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 bg-amber-50/50 hover:bg-amber-100 transition-colors"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-[10px] font-mono text-amber-600">{slot.slot_id}</span>
                  <span className="text-[9px] text-amber-400 text-center leading-tight line-clamp-2">{slot.label}</span>
                </>
              )}
            </button>
          )}
          {provided.placeholder}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      )}
    </Droppable>
  );
}