import { useState } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { ChevronDown, ChevronUp, X, Inbox } from "lucide-react";

export default function UnassignedTray({ unassigned, selectedUrl, onSelect, onRemove }) {
  const [open, setOpen] = useState(true);

  if (unassigned.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 mt-4">
      <div className="bg-white border-2 border-amber-300 rounded-xl overflow-hidden shadow-sm">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-100 hover:bg-amber-200 transition-colors"
        >
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
            <Inbox className="w-4 h-4" />
            Unassigned Images ({unassigned.length})
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-amber-700" />}
        </button>

        {open && (
          <>
            <p className="px-4 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-200">
              Drag onto any empty slot, or tap an image then tap an empty slot to assign it.
            </p>
            <Droppable droppableId="unassigned-tray" direction="horizontal">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="flex gap-3 p-3 overflow-x-auto"
                >
                  {unassigned.map((img, idx) => (
                    <Draggable key={img.id} draggableId={img.id} index={idx}>
                      {(p, snapshot) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          className={`relative shrink-0 cursor-grab active:cursor-grabbing select-none transition-all ${
                            snapshot.isDragging ? "shadow-2xl scale-105 z-50" : ""
                          }`}
                          onClick={() => onSelect(selectedUrl === img.url ? null : img.url)}
                        >
                          <div className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                            selectedUrl === img.url ? "border-amber-500 ring-2 ring-amber-400" : "border-amber-200"
                          }`} style={{ width: 80, height: 80 }}>
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-[9px] text-amber-700 text-center mt-1 max-w-[80px] truncate">{img.name}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); onRemove(img.id); }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </>
        )}
      </div>
    </div>
  );
}