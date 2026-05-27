import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

export default function UnassignedTray({ unassigned, selectedId, onSelect, onRemoveFromTray }) {
  const [open, setOpen] = useState(true);

  if (unassigned.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-parchment border-t-2 border-amber-300 shadow-lg">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
      >
        <span>🗂 Unassigned Images ({unassigned.length})</span>
        {open ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {open && (
        <Droppable droppableId="unassigned-tray" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-3 overflow-x-auto px-4 pb-3 pt-1"
            >
              {unassigned.map((img, index) => (
                <Draggable key={img.id} draggableId={img.id} index={index}>
                  {(p, snap) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      {...p.dragHandleProps}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing select-none transition-all ${
                        selectedId?.id === img.id ? 'border-amber-500 ring-2 ring-amber-400' : 'border-amber-200 hover:border-amber-400'
                      } ${snap.isDragging ? 'shadow-xl scale-105 rotate-2' : ''}`}
                      onClick={() => onSelect(selectedId?.id === img.id ? null : img)}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveFromTray(img.id); }}
                        className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                        <p className="text-[8px] text-white truncate">{img.name}</p>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
}