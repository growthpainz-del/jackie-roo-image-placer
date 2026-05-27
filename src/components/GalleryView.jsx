import { MANUSCRIPT, SLOTS_MAP } from "@/lib/manuscript";
import ImageSlot from "@/components/ImageSlot";

export default function GalleryView({ illustrationsMap, onUpload, onAssign, selectedUnassigned }) {
  return (
    <div className="py-8 space-y-8">
      {MANUSCRIPT.chapters.map((chapter) => {
        const chapterSlots = chapter.blocks.filter(b => b.type === "slot");
        if (chapterSlots.length === 0) return null;

        return (
          <div key={chapter.id}>
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-amber-900 text-amber-100 text-xs font-bold px-2.5 py-1 rounded-full">
                {chapter.title}
              </div>
              <span className="text-amber-700 text-sm font-medium">{chapter.subtitle}</span>
              <div className="flex-1 h-px bg-amber-200" />
              <span className="text-xs text-amber-500">
                {chapterSlots.filter(b => illustrationsMap[b.slot_id]?.image_url).length}/{chapterSlots.length} placed
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {chapterSlots.map((block) => {
                const slotMeta = SLOTS_MAP[block.slot_id] || { slot_id: block.slot_id, label: block.label, order_index: block.order_index };
                const record = illustrationsMap[block.slot_id];
                return (
                  <div key={block.slot_id} className="relative group">
                    <ImageSlot
                      slot={slotMeta}
                      imageUrl={record?.image_url}
                      onUpload={onUpload}
                      onAssign={onAssign}
                      selectedUnassigned={selectedUnassigned}
                      compact
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[8px] px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg leading-tight">
                      {block.slot_id}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}