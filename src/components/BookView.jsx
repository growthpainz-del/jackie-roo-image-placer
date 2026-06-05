import { BOOK_CHAPTERS } from '@/lib/bookContent';
import ImageSlot from '@/components/ImageSlot';

export default function BookView({ illustrationMap, onUpload, onAssignFromTray, onRemove, selectedUnassigned, setSelectedUnassigned }) {
  return (
    <div className="space-y-0">
      {BOOK_CHAPTERS.map((chapter) => (
        <section key={chapter.id} data-chapter={chapter.id} className="mb-12">
          {/* Chapter header */}
          <div className="text-center py-8 mb-6 border-b border-amber-200">
            <p className="text-xs uppercase tracking-widest text-amber-500 mb-1">{chapter.title}</p>
            <h2 className="text-2xl font-bold text-amber-900">{chapter.subtitle}</h2>
          </div>

          {/* Blocks */}
          <div className="space-y-8">
            {chapter.blocks.map((block, i) => {
              if (block.type === 'text') {
                return (
                  <p key={i} className="text-amber-950 leading-relaxed text-[17px] font-serif px-2">
                    {block.content}
                  </p>
                );
              }
              if (block.type === 'pageturn') {
                return (
                  <div key={i} className="flex items-center gap-4 my-6">
                    <div className="flex-1 border-t border-dashed border-amber-300" />
                    <span className="text-xs text-amber-400 italic">— page turn —</span>
                    <div className="flex-1 border-t border-dashed border-amber-300" />
                  </div>
                );
              }
              if (block.type === 'slot') {
                return (
                  <ImageSlot
                    key={block.slot_id}
                    slot={block}
                    illustration={illustrationMap[block.slot_id]}
                    onUpload={onUpload}
                    onAssignFromTray={onAssignFromTray}
                    onRemove={onRemove}
                    selectedUnassigned={selectedUnassigned}
                    setSelectedUnassigned={setSelectedUnassigned}
                    layout="book"
                  />
                );
              }
              return null;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}