import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Tag, X, Check } from 'lucide-react';

const MOODS = [
  { value: 'wonder',      label: 'Wonder',      color: '#8b5cf6', emoji: '✨' },
  { value: 'joy',         label: 'Joy',          color: '#f59e0b', emoji: '😄' },
  { value: 'tension',     label: 'Tension',      color: '#ef4444', emoji: '⚡' },
  { value: 'calm',        label: 'Calm',         color: '#6366f1', emoji: '🌊' },
  { value: 'comedy',      label: 'Comedy',       color: '#f97316', emoji: '😂' },
  { value: 'tenderness',  label: 'Tenderness',   color: '#ec4899', emoji: '💛' },
  { value: 'discovery',   label: 'Discovery',    color: '#10b981', emoji: '🔍' },
  { value: 'peak',        label: 'Peak',         color: '#dc2626', emoji: '🔥' },
  { value: 'melancholy',  label: 'Melancholy',   color: '#64748b', emoji: '🌧️' },
  { value: 'excitement',  label: 'Excitement',   color: '#0ea5e9', emoji: '🚀' },
];

export const MOOD_MAP = Object.fromEntries(MOODS.map(m => [m.value, m]));

export default function BeatTagger({ blockRef, chapterId, orderIndex, labelSnapshot, existingTag, onSaved }) {
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState(existingTag?.mood || '');
  const [intensity, setIntensity] = useState(existingTag?.intensity || 5);
  const [note, setNote] = useState(existingTag?.note || '');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const activeMood = MOOD_MAP[mood];

  const handleSave = async () => {
    if (!mood) return;
    setSaving(true);
    const data = { block_ref: blockRef, chapter_id: chapterId, order_index: orderIndex, mood, intensity, note, label_snapshot: labelSnapshot?.slice(0, 120) };
    if (existingTag?.id) {
      await base44.entities.BeatTag.update(existingTag.id, data);
    } else {
      await base44.entities.BeatTag.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ['beat-tags'] });
    setSaving(false);
    setOpen(false);
    onSaved?.();
  };

  const handleDelete = async () => {
    if (!existingTag?.id) return;
    await base44.entities.BeatTag.delete(existingTag.id);
    queryClient.invalidateQueries({ queryKey: ['beat-tags'] });
    setOpen(false);
    onSaved?.();
  };

  return (
    <div className="relative inline-block">
      {/* Trigger chip */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border transition-all ${
          existingTag
            ? 'border-transparent text-white font-medium'
            : 'border-dashed border-amber-300 text-amber-400 hover:border-amber-500 hover:text-amber-600 bg-transparent'
        }`}
        style={existingTag ? { backgroundColor: MOOD_MAP[existingTag.mood]?.color || '#888' } : {}}
        title={existingTag ? `${existingTag.mood} · ${existingTag.intensity}/10` : 'Tag this beat'}
      >
        {existingTag ? (
          <>
            <span>{MOOD_MAP[existingTag.mood]?.emoji}</span>
            <span>{existingTag.intensity}</span>
          </>
        ) : (
          <Tag className="w-2.5 h-2.5" />
        )}
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-6 z-50 w-64 rounded-xl border border-amber-200 bg-white shadow-xl p-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-amber-900">Tag Beat</p>
            <button onClick={() => setOpen(false)}><X className="w-3.5 h-3.5 text-amber-400" /></button>
          </div>

          {/* Mood grid */}
          <div className="grid grid-cols-5 gap-1 mb-3">
            {MOODS.map(m => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                title={m.label}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border-2 text-[9px] transition-all ${
                  mood === m.value ? 'border-current scale-110' : 'border-transparent hover:border-current opacity-60'
                }`}
                style={{ color: m.color }}
              >
                <span className="text-base leading-none">{m.emoji}</span>
                <span className="leading-none font-medium">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Intensity slider */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-amber-700 font-medium">Intensity</p>
              <span className="text-xs font-bold" style={{ color: activeMood?.color || '#b45309' }}>{intensity}/10</span>
            </div>
            <input
              type="range" min="1" max="10" value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              className="w-full h-1.5 rounded accent-amber-500"
            />
            <div className="flex justify-between text-[9px] text-amber-300 mt-0.5">
              <span>quiet</span><span>peak</span>
            </div>
          </div>

          {/* Note */}
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Editorial note… (optional)"
            rows={2}
            className="w-full text-[11px] border border-amber-100 rounded-md px-2 py-1 resize-none outline-none focus:border-amber-300 mb-2"
          />

          <div className="flex gap-1.5">
            <button
              onClick={handleSave}
              disabled={!mood || saving}
              className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white disabled:opacity-40 transition-colors"
            >
              <Check className="w-3 h-3" />
              {saving ? 'Saving…' : existingTag ? 'Update' : 'Tag'}
            </button>
            {existingTag && (
              <button
                onClick={handleDelete}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}