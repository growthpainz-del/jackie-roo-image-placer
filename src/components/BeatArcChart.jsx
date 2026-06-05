import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MOOD_MAP } from '@/components/BeatTagger';
import { MANUSCRIPT } from '@/lib/manuscript';

const W = 700;
const H = 160;
const PAD_X = 50;
const PAD_Y = 20;

// Build a flat list of all blocks with a global order position (0–1 scale)
const ALL_BLOCKS = [];
let totalBlocks = 0;
for (const ch of MANUSCRIPT.chapters) {
  for (const b of ch.blocks) {
    if (b.type !== 'pageturn') {
      ALL_BLOCKS.push({ ...b, chapter_id: ch.id, chapter_title: ch.title });
      totalBlocks++;
    }
  }
}
ALL_BLOCKS.forEach((b, i) => { b._pos = i / (totalBlocks - 1); });

function posToX(pos) {
  return PAD_X + pos * (W - PAD_X * 2);
}
function intensityToY(intensity) {
  return H - PAD_Y - ((intensity / 10) * (H - PAD_Y * 2));
}

// Chapter boundary lines
const CHAPTER_STARTS = [];
let seen = new Set();
ALL_BLOCKS.forEach(b => {
  if (!seen.has(b.chapter_id)) {
    seen.add(b.chapter_id);
    CHAPTER_STARTS.push({ chapter_id: b.chapter_id, title: b.chapter_title, pos: b._pos });
  }
});

export default function BeatArcChart({ onJump }) {
  const [active, setActive] = useState(null);

  const { data: tags = [] } = useQuery({
    queryKey: ['beat-tags'],
    queryFn: () => base44.entities.BeatTag.list(),
  });

  // Sort by order_index ascending, deduplicate by block_ref (latest wins)
  const tagMap = {};
  for (const t of tags) tagMap[t.block_ref] = t;
  const sorted = Object.values(tagMap).sort((a, b) => a.order_index - b.order_index);

  // Find matching _pos for each tag
  const points = sorted.map(tag => {
    const block = ALL_BLOCKS.find(b => (b.slot_id || `${b.chapter_id}:text`) === tag.block_ref);
    const pos = block?._pos ?? (tag.order_index / 100);
    return { tag, pos, x: posToX(pos), y: intensityToY(tag.intensity) };
  });

  // Build smooth SVG path
  let path = '';
  if (points.length >= 2) {
    path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }
  }

  const activePoint = points.find(p => p.tag.block_ref === active);
  const activeMood = activePoint ? MOOD_MAP[activePoint.tag.mood] : null;

  if (tags.length === 0) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm">
        <div className="px-5 pt-4 pb-4 text-center">
          <p className="text-xs font-bold text-amber-900 mb-1">Live Beat Arc</p>
          <p className="text-xs text-amber-400">No beats tagged yet — use the <span className="font-mono bg-amber-50 px-1 rounded">🏷</span> buttons inline to start building your arc.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-2 border-b border-amber-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-amber-900">Live Beat Arc</h2>
          <p className="text-xs text-amber-400">{points.length} beat{points.length !== 1 ? 's' : ''} tagged · tap to explore</p>
        </div>
        <div className="flex items-center gap-1">
          {Object.values(MOOD_MAP).filter(m => sorted.some(t => t.mood === m.value)).map(m => (
            <span key={m.value} title={m.label} className="text-sm leading-none">{m.emoji}</span>
          ))}
        </div>
      </div>

      <div className="relative px-2 pt-3 pb-1">
        <div className="absolute left-3 top-3 bottom-6 flex flex-col justify-between pointer-events-none">
          <span className="text-[9px] text-amber-300 leading-none">peak</span>
          <span className="text-[9px] text-amber-300 leading-none">quiet</span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }} preserveAspectRatio="xMidYMid meet">
          {/* Chapter dividers */}
          {CHAPTER_STARTS.slice(1).map(cs => (
            <line
              key={cs.chapter_id}
              x1={posToX(cs.pos)} y1={PAD_Y}
              x2={posToX(cs.pos)} y2={H - 10}
              stroke="#fde68a" strokeWidth="1" strokeDasharray="3 3"
            />
          ))}
          {CHAPTER_STARTS.map(cs => (
            <text key={cs.chapter_id + '-lbl'} x={posToX(cs.pos) + 3} y={H - 2} fontSize="7" fill="#d97706" fontFamily="Georgia, serif">
              {cs.title.replace('Chapter ', 'Ch').replace('Finale', 'Fin')}
            </text>
          ))}

          {/* Gradient fill */}
          {points.length >= 2 && (
            <>
              <defs>
                <linearGradient id="liveArcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d={path + ` L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`}
                fill="url(#liveArcGrad)"
              />
              <path d={path} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* Beat nodes */}
          {points.map(({ tag, x, y }) => {
            const m = MOOD_MAP[tag.mood];
            const isActive = active === tag.block_ref;
            return (
              <g key={tag.block_ref} onClick={() => {
                setActive(isActive ? null : tag.block_ref);
                if (!isActive && onJump) onJump(tag.chapter_id);
              }} style={{ cursor: 'pointer' }}>
                {isActive && <circle cx={x} cy={y} r={14} fill={m?.color || '#888'} fillOpacity="0.15" />}
                <circle cx={x} cy={y} r={isActive ? 9 : 6} fill={isActive ? m?.color : '#fff'} stroke={m?.color || '#888'} strokeWidth="2.5" />
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize="7" style={{ pointerEvents: 'none' }}>
                  {m?.emoji}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail card */}
      <div className="min-h-[48px] px-5 py-3 bg-amber-50 border-t border-amber-100 transition-all">
        {activePoint ? (
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none mt-0.5">{activeMood?.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold" style={{ color: activeMood?.color }}>{activeMood?.label}</p>
                <span className="text-[10px] text-amber-500">intensity {activePoint.tag.intensity}/10</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-snug truncate">{activePoint.tag.label_snapshot}</p>
              {activePoint.tag.note && <p className="text-[10px] text-amber-400 italic mt-0.5">"{activePoint.tag.note}"</p>}
            </div>
          </div>
        ) : (
          <p className="text-xs text-amber-300 italic">Tap a beat to inspect the moment…</p>
        )}
      </div>
    </div>
  );
}