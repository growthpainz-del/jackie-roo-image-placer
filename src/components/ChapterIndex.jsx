import { MANUSCRIPT } from '@/lib/manuscript';

const CHAPTER_EMOJIS = {
  ch1: '🤖',
  ch2: '🌳',
  ch3: '🌈',
  ch4: '⛵',
  ch5: '⚽',
  finale: '🌙',
};

export default function ChapterIndex({ illustrationMap, onJump }) {
  const totalSlots = MANUSCRIPT.chapters.reduce((acc, ch) =>
    acc + ch.blocks.filter(b => b.type === 'slot').length, 0);
  const totalPlaced = Object.values(illustrationMap).filter(i => i?.image_url).length;

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-amber-900">Jackie Roo &amp; The Rainy Day Robots</h2>
          <p className="text-xs text-amber-500 mt-0.5">Jump to any chapter</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-amber-800">{totalPlaced}/{totalSlots}</p>
          <p className="text-xs text-amber-400">illustrations placed</p>
        </div>
      </div>

      {/* Chapter list */}
      <div className="divide-y divide-amber-100">
        {MANUSCRIPT.chapters.map((chapter) => {
          const slots = chapter.blocks.filter(b => b.type === 'slot');
          const placed = slots.filter(s => illustrationMap[s.slot_id]?.image_url).length;
          const pct = slots.length ? Math.round((placed / slots.length) * 100) : 0;
          const done = placed === slots.length;

          return (
            <button
              key={chapter.id}
              onClick={() => onJump(chapter.id)}
              className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-amber-50 transition-colors text-left"
            >
              <span className="text-xl w-7 flex-shrink-0">{CHAPTER_EMOJIS[chapter.id] || '📖'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-900">{chapter.title}</span>
                  <span className="text-xs text-amber-500 truncate">{chapter.subtitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-amber-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium flex-shrink-0 ${done ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {placed}/{slots.length}
                  </span>
                </div>
              </div>
              <span className="text-amber-300 flex-shrink-0 text-sm">→</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}