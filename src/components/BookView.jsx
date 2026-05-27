import { useEffect } from "react";
import { MANUSCRIPT, SLOTS_MAP } from "@/lib/manuscript";
import ImageSlot from "@/components/ImageSlot";

const LS_SCROLL = "jackieroo_scroll";

export default function BookView({ illustrationsMap, onUpload, onAssign, selectedUnassigned, hasUnassigned }) {
  // Save scroll on scroll, restore on mount
  useEffect(() => {
    const savedY = parseInt(localStorage.getItem(LS_SCROLL) || "0", 10);
    if (savedY > 0) window.scrollTo({ top: savedY });

    const handleScroll = () => localStorage.setItem(LS_SCROLL, String(window.scrollY));
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="py-8 space-y-0">
      {MANUSCRIPT.chapters.map((chapter) => (
        <div key={chapter.id} id={chapter.id} className="mb-12">
          {/* Chapter header */}
          <div className="text-center py-8 mb-6">
            <div className="inline-block bg-amber-900 text-amber-100 text-xs font-bold px-3 py-1 rounded-full mb-3 tracking-widest uppercase">
              {chapter.title}
            </div>
            <h2 className="text-2xl font-bold text-amber-900 font-serif">{chapter.subtitle}</h2>
            <div className="w-16 h-0.5 bg-amber-400 mx-auto mt-3" />
          </div>

          {/* Blocks */}
          <div className="space-y-6">
            {chapter.blocks.map((block, idx) => {
              if (block.type === "text") {
                return (
                  <div key={idx} className="bg-white rounded-xl px-6 py-5 shadow-sm border border-amber-100">
                    <p className="text-amber-950 leading-relaxed font-serif text-base">{block.content}</p>
                  </div>
                );
              }

              if (block.type === "pageturn") {
                return (
                  <div key={idx} className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-amber-200" />
                    <span className="text-amber-400 text-xs font-medium px-2">— page turn —</span>
                    <div className="flex-1 h-px bg-amber-200" />
                  </div>
                );
              }

              if (block.type === "slot") {
                const slotMeta = SLOTS_MAP[block.slot_id];
                const record = illustrationsMap[block.slot_id];
                return (
                  <ImageSlot
                    key={block.slot_id}
                    slot={slotMeta || { slot_id: block.slot_id, label: block.label, order_index: block.order_index }}
                    imageUrl={record?.image_url}
                    onUpload={onUpload}
                    onAssign={onAssign}
                    selectedUnassigned={selectedUnassigned}
                  />
                );
              }

              return null;
            })}
          </div>
        </div>
      ))}
    </div>
  );
}