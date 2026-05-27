import { useRef, useState } from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Upload, AlertTriangle, X, ImageIcon } from "lucide-react";

const MIN_KDP_PX = 2550;

export default function ImageSlot({ slot, imageUrl, onUpload, onAssign, selectedUnassigned, compact = false }) {
  const fileRef = useRef();
  const [lowRes, setLowRes] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await onUpload(slot.slot_id, file);
    setUploading(false);
    e.target.value = "";
  };

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setLowRes(naturalWidth < MIN_KDP_PX || naturalHeight < MIN_KDP_PX);
  };

  const handleSlotClick = () => {
    if (selectedUnassigned && !imageUrl) {
      onAssign(slot.slot_id, selectedUnassigned);
    } else if (!imageUrl) {
      fileRef.current?.click();
    }
  };

  if (compact) {
    // Gallery tile mode
    return (
      <Droppable droppableId={slot.slot_id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            onClick={handleSlotClick}
            className={`relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
              imageUrl
                ? "border-green-400 bg-green-50"
                : snapshot.isDraggingOver
                ? "border-amber-400 bg-amber-50 scale-105"
                : selectedUnassigned
                ? "border-dashed border-amber-400 bg-amber-50"
                : "border-dashed border-amber-300 bg-amber-50 hover:border-amber-500"
            }`}
            style={{ aspectRatio: "1/1" }}
          >
            {imageUrl ? (
              <>
                <img src={imageUrl} alt={slot.label} className="w-full h-full object-cover" onLoad={handleImageLoad} />
                {lowRes && (
                  <div className="absolute top-1 right-1 bg-orange-500 text-white rounded p-0.5">
                    <AlertTriangle className="w-3 h-3" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
                <ImageIcon className="w-5 h-5 text-amber-400 mb-1" />
                <p className="text-[9px] text-amber-600 text-center leading-tight line-clamp-2">{slot.label}</p>
              </div>
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  }

  // Book view mode — full width
  return (
    <Droppable droppableId={slot.slot_id}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`relative rounded-xl overflow-hidden border-2 transition-all ${
            imageUrl
              ? "border-green-300"
              : snapshot.isDraggingOver
              ? "border-amber-500 bg-amber-100 shadow-lg scale-[1.01]"
              : selectedUnassigned
              ? "border-dashed border-amber-400 bg-amber-50 cursor-pointer"
              : "border-dashed border-amber-300 bg-amber-50"
          }`}
        >
          {imageUrl ? (
            <div className="relative">
              <img
                src={imageUrl}
                alt={slot.label}
                className="w-full"
                onLoad={handleImageLoad}
              />
              {lowRes && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-orange-500 text-white text-xs px-2 py-1 rounded-full shadow">
                  <AlertTriangle className="w-3 h-3" />
                  Low res for print
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs px-2 py-1 rounded-full transition-colors"
              >
                Replace
              </button>
            </div>
          ) : (
            <div
              onClick={handleSlotClick}
              className="flex flex-col items-center justify-center py-12 px-6 cursor-pointer hover:bg-amber-100 transition-colors"
            >
              {uploading ? (
                <div className="w-8 h-8 border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin mb-3" />
              ) : (
                <Upload className="w-8 h-8 text-amber-400 mb-3" />
              )}
              <p className="text-sm text-amber-700 font-medium text-center mb-1">
                {selectedUnassigned ? "Tap to assign selected image" : "Click to upload"}
              </p>
              <p className="text-xs text-amber-500 text-center italic">
                {slot.label}
              </p>
              <p className="text-xs text-amber-400 mt-1">Slot: {slot.slot_id}</p>
            </div>
          )}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}