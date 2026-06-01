import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Flag, X, Check, Loader2, CheckCircle } from 'lucide-react';

export default function FlagPanel({ page, pageIndex, flags, onClose }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const pageFlags = flags.filter(f => f.page_index === pageIndex);

  const createFlag = useMutation({
    mutationFn: () => base44.entities.Flag.create({
      page_index: pageIndex,
      slot_id: page.slot_id || null,
      chapter_title: page.chapterTitle,
      note,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flags'] });
      setNote('');
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    },
  });

  const resolveFlag = useMutation({
    mutationFn: (id) => base44.entities.Flag.update(id, { resolved: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flags'] }),
  });

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center pointer-events-none">
      <div
        className="w-full max-w-lg mb-16 mx-4 bg-gray-900 border border-amber-700/40 rounded-2xl shadow-2xl pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2 text-amber-300">
            <Flag className="w-4 h-4" />
            <span className="text-sm font-semibold">Flag an Issue</span>
            <span className="text-xs text-amber-600">· page {pageIndex + 1}</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Input */}
          <div className="flex gap-2">
            <textarea
              autoFocus
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && note.trim()) { e.preventDefault(); createFlag.mutate(); } }}
              placeholder="Describe the issue (e.g. wrong image, text error, missing slot)…"
              rows={2}
              className="flex-1 text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-amber-50 placeholder-gray-500 focus:outline-none focus:border-amber-600 resize-none"
            />
            <button
              onClick={() => note.trim() && createFlag.mutate()}
              disabled={!note.trim() || createFlag.isPending}
              className="self-end flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white disabled:opacity-40 transition-colors"
            >
              {createFlag.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Flag className="w-3.5 h-3.5" />}
              {saved ? 'Saved!' : 'Flag'}
            </button>
          </div>

          {/* Existing flags for this page */}
          {pageFlags.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Flags on this page</p>
              {pageFlags.map(f => (
                <div key={f.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${f.resolved ? 'bg-gray-800/40 opacity-50' : 'bg-red-950/40 border border-red-900/30'}`}>
                  <p className="flex-1 text-gray-300 leading-snug">{f.note}</p>
                  {!f.resolved && (
                    <button
                      onClick={() => resolveFlag.mutate(f.id)}
                      className="flex-shrink-0 text-green-500 hover:text-green-400 transition-colors"
                      title="Mark resolved"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}