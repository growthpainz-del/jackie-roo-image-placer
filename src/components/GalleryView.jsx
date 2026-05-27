import { SLOT_CONFIG, CHAPTER_META } from '@/lib/slotConfig';
import ImageSlot from '@/components/ImageSlot';

const CHAPTERS = [...new Set(SLOT_CONFIG.map(s => s.chapter))];

export default function GalleryView({ illustrationMap, onUpload, onAssignFromTray, onRemove, selectedUnassigned, setSelectedUnassigned }) {
  return (
    <div className="space-y-10">
      {CHAPTERS.map(chapterKey => {
        const slots = SLOT_CONFIG.filter(s => s.chapter === chapterKey);
        const meta = CHAPTER_META[chapterKey];
        return (
          <section key={chapterKey} data-chapter={chapterKey}>
            <div className="flex items-baseline gap-3 mb-4 pb-2 border-b border-amber-200">
              <h2 className="text-lg font-bold text-amber-900">{meta?.title || chapterKey}</h2>
              <span className="text-sm text-amber-600">{meta?.subtitle}</span>
              <span className="ml-auto text-xs text-amber-500">
                {slots.filter(s => illustrationMap[s.slot_id]?.image_url).length}/{slots.length} placed
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slots.map(slot => (
                <ImageSlot
                  key={slot.slot_id}
                  slot={slot}
                  illustration={illustrationMap[slot.slot_id]}
                  onUpload={onUpload}
                  onAssignFromTray={onAssignFromTray}
                  onRemove={onRemove}
                  selectedUnassigned={selectedUnassigned}
                  setSelectedUnassigned={setSelectedUnassigned}
                  layout="gallery"
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}