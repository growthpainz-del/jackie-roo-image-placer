import { useQuery } from '@tanstack/react-query';
import { BOOK_CHAPTERS } from '@/lib/bookContent';
import ImageSlot from '@/components/ImageSlot';
import BeatTagger from '@/components/BeatTagger';
import { base44 } from '@/api/base44Client';

export default function BookView({ illustrationMap, onUpload, onAssignFromTray, onRemove, selectedUnassigned, setSelectedUnassigned }) {
  const { data: tags = [] } = useQuery({
    queryKey: ['beat-tags'],
    queryFn: () => base44.entities.BeatTag.list(),
  });

  const tagMap = Object.fromEntries(tags.map(t => [t.block_ref, t]));

  return (
    <div className="space-y-0">
      {BOOK_CHAPTERS.map((chapter) => (
        <section key={chapter.id} data-chapter={chapter.id} className="mb-12">
          <div className="text-center py-8 mb-6 border-b border-amber-200">
            <p className="text-xs uppercase tracking-widest text-amber-500 mb-1">{chapter.title}</p>
            <h2 className="text-2xl font-bold text-amber-900">{chapter.subtitle}</h2>
          </div>

          <div className="space-y-8">
            {chapter.blocks.map((block, i) => {
              if (block.type === 'text') {
                const blockRef = `${chapter.id}:text:${i}`;
                return (
                  <div key={i} className="group relative">
                    <p className="text-amber-950 leading-relaxed text-[17px] font-serif px-2">
                      {block.content}
                    </p>
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <BeatTagger
                        blockRef={blockRef}
                        chapterId={chapter.id}
                        orderIndex={block.order_index || i}
                        labelSnapshot={block.content?.slice(0, 120)}
                        existingTag={tagMap[blockRef]}
                      />
                    </div>
                  </div>
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
                const blockRef = block.slot_id;
                return (
                  <div key={block.slot_id} className="group relative">
                    <ImageSlot
                      slot={block}
                      illustration={illustrationMap[block.slot_id]}
                      onUpload={onUpload}
                      onAssignFromTray={onAssignFromTray}
                      onRemove={onRemove}
                      selectedUnassigned={selectedUnassigned}
                      setSelectedUnassigned={setSelectedUnassigned}
                      layout="book"
                    />
                    <div className="absolute top-2 right-2">
                      <BeatTagger
                        blockRef={blockRef}
                        chapterId={chapter.id}
                        orderIndex={block.order_index || i}
                        labelSnapshot={block.label}
                        existingTag={tagMap[blockRef]}
                      />
                    </div>
                  </div>
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