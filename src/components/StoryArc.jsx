import { useState } from 'react';

// Emotional beats mapped to each chapter beat point
// tension: 0 (calm/cozy) → 10 (peak excitement/drama)
const BEATS = [
  { chapter: 'ch1', label: 'Ch 1', title: 'Creating the Robot Friends', emoji: '🤖', tension: 3, mood: 'Cozy wonder', color: '#f59e0b', desc: 'A rainy morning, Jackie gathers treasures and brings five robots to life with glitter and joy.' },
  { chapter: 'ch2', label: 'Ch 2', title: 'The Oak Tree Adventure', emoji: '🌳', tension: 5, mood: 'Playful delight', color: '#10b981', desc: 'The grand puddle grid. Splashtermath. The whole gang in muddy glorious chaos.' },
  { chapter: 'ch3', label: 'Ch 3', title: 'The Secret Rainbow Cave', emoji: '🌈', tension: 6, mood: 'Magical discovery', color: '#8b5cf6', desc: 'Scotch Bot dives into the waterfall. A rainbow bridge forms. Singing colours inside the cave.' },
  { chapter: 'ch4', label: 'Ch 4', title: 'The Whispering Windship', emoji: '⛵', tension: 9, mood: 'High adventure', color: '#3b82f6', desc: 'The Storm King battle. Jackie at the helm, wand raised. Breathless and magnificent.' },
  { chapter: 'ch5-a', chapter_id: 'ch5', label: 'Ch 5a', title: 'The Woolly Goalkeeper', emoji: '⚽', tension: 7, mood: 'Comic chaos', color: '#ef4444', desc: "Scotch Bot loses his eye mid-match. Everyone freezes. Then — Tea Cozy Tess finds it in the wool ball." },
  { chapter: 'ch5-b', chapter_id: 'ch5', label: 'Ch 5b', title: 'Quack Bot & the Fairy', emoji: '🦆', tension: 4, mood: 'Warm laughter', color: '#f97316', desc: "Mum laughs properly. The kind that takes over. Quack Bot has one very fine swirly eye." },
  { chapter: 'finale', label: 'Finale', title: 'Wordless Rocking Scene', emoji: '🌙', tension: 1, mood: 'Quiet peace', color: '#6366f1', desc: 'Mum rocking Jackie. Five robots on the windowsill. Rain. Acorn glowing. Safe.' },
];

const W = 700;
const H = 160;
const PAD_X = 50;
const PAD_Y = 20;

function tensionToY(t) {
  // tension 0 = bottom (calm), 10 = top (peak)
  return H - PAD_Y - ((t / 10) * (H - PAD_Y * 2));
}

function beatToX(i) {
  return PAD_X + (i / (BEATS.length - 1)) * (W - PAD_X * 2);
}

// Build smooth SVG path through all beats
function buildPath() {
  const points = BEATS.map((b, i) => ({ x: beatToX(i), y: tensionToY(b.tension) }));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}

export default function StoryArc({ onJump }) {
  const [active, setActive] = useState(null);
  const path = buildPath();

  const handleClick = (beat) => {
    setActive(beat.chapter);
    const chId = beat.chapter_id || beat.chapter;
    const el = document.querySelector(`[data-chapter="${chId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-white overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-2 border-b border-amber-100">
        <h2 className="text-sm font-bold text-amber-900">Story Arc</h2>
        <p className="text-xs text-amber-400">Emotional beats · tap a node to jump</p>
      </div>

      {/* Y-axis labels */}
      <div className="relative px-2 pt-3 pb-1">
        <div className="absolute left-3 top-3 bottom-6 flex flex-col justify-between pointer-events-none">
          <span className="text-[9px] text-amber-300 leading-none">peak</span>
          <span className="text-[9px] text-amber-300 leading-none">calm</span>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 160 }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Horizontal guide lines */}
          {[2, 5, 8].map(t => (
            <line
              key={t}
              x1={PAD_X} y1={tensionToY(t)}
              x2={W - PAD_X} y2={tensionToY(t)}
              stroke="#fde68a" strokeWidth="1" strokeDasharray="4 4"
            />
          ))}

          {/* Gradient fill under the curve */}
          <defs>
            <linearGradient id="arcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path
            d={path + ` L ${beatToX(BEATS.length - 1)} ${H} L ${beatToX(0)} ${H} Z`}
            fill="url(#arcGrad)"
          />

          {/* Main curve */}
          <path d={path} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Beat nodes */}
          {BEATS.map((beat, i) => {
            const x = beatToX(i);
            const y = tensionToY(beat.tension);
            const isActive = active === beat.chapter;
            return (
              <g key={beat.chapter} onClick={() => handleClick(beat)} style={{ cursor: 'pointer' }}>
                {/* Pulse ring on active */}
                {isActive && (
                  <circle cx={x} cy={y} r={14} fill={beat.color} fillOpacity="0.15" />
                )}
                <circle
                  cx={x} cy={y} r={isActive ? 9 : 7}
                  fill={isActive ? beat.color : '#fff'}
                  stroke={beat.color}
                  strokeWidth="2.5"
                  style={{ transition: 'r 0.15s' }}
                />
                {/* Chapter label below node */}
                <text
                  x={x} y={H - 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#b45309"
                  fontFamily="Georgia, serif"
                >
                  {beat.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail card for active beat */}
      <div className="min-h-[56px] px-5 py-3 bg-amber-50 border-t border-amber-100 transition-all">
        {active ? (() => {
          const beat = BEATS.find(b => b.chapter === active);
          return beat ? (
            <div className="flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">{beat.emoji}</span>
              <div>
                <p className="text-xs font-bold text-amber-900">{beat.title}</p>
                <p className="text-[11px] font-medium" style={{ color: beat.color }}>{beat.mood}</p>
                <p className="text-[11px] text-amber-600 mt-0.5 leading-snug">{beat.desc}</p>
              </div>
            </div>
          ) : null;
        })() : (
          <p className="text-xs text-amber-300 italic">Tap a beat to explore the moment…</p>
        )}
      </div>
    </div>
  );
}