import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { BOOK_CHAPTERS } from '@/lib/bookContent';
import { Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';

const CHAPTER_OPTIONS = BOOK_CHAPTERS.map(ch => ({
  id: ch.id,
  label: `${ch.title}: ${ch.subtitle}`,
  text: ch.blocks
    .filter(b => b.type === 'text')
    .map(b => b.content)
    .join('\n\n'),
})).filter(c => c.text.trim().length > 0);

const SEVERITY_STYLES = {
  error:      { bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700',    icon: <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" /> },
  warning:    { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700',  icon: <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> },
  suggestion: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', icon: <Sparkles className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" /> },
  praise:     { bg: 'bg-emerald-50',border: 'border-emerald-200',badge: 'bg-emerald-100 text-emerald-700',icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" /> },
};

function IssueCard({ issue }) {
  const [open, setOpen] = useState(false);
  const s = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.suggestion;
  return (
    <div className={`rounded-lg border ${s.border} ${s.bg} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start gap-2 px-3 py-2.5 text-left"
      >
        {s.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${s.badge}`}>
              {issue.severity}
            </span>
            <span className="text-[11px] font-medium text-gray-800">{issue.category}</span>
          </div>
          <p className="text-xs text-gray-700 mt-0.5 leading-snug">{issue.summary}</p>
        </div>
        <div className="shrink-0 mt-0.5 text-gray-400">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-current/10">
          {issue.original && (
            <div className="mt-2">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Original</p>
              <p className="text-xs text-gray-600 bg-white/70 rounded px-2 py-1.5 italic leading-snug">"{issue.original}"</p>
            </div>
          )}
          {issue.suggestion && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Suggestion</p>
              <p className="text-xs text-gray-700 bg-white/70 rounded px-2 py-1.5 leading-snug">"{issue.suggestion}"</p>
            </div>
          )}
          {issue.explanation && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Why</p>
              <p className="text-xs text-gray-600 leading-snug">{issue.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProofReader({ onClose }) {
  const [selectedChapter, setSelectedChapter] = useState(CHAPTER_OPTIONS[0]?.id || '');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const chapter = CHAPTER_OPTIONS.find(c => c.id === selectedChapter);

  const runProofread = async () => {
    if (!chapter) return;
    setLoading(true);
    setResults(null);
    const result = await base44.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt: `You are an expert children's book editor with deep knowledge of picture book craft, rhythm, read-aloud quality, age-appropriate language, and emotional resonance.

The book is "Jackie Roo & The Rainy Day Robots" — a Scottish-set picture book for ages 3–7. It features playful sound words (whizz-beep!, clink-clank!, etc.), cozy warmth, imaginative play, and a loving mother-daughter relationship. The tone is warm, silly, poetic, and wonder-filled.

Proofread the following chapter text. Evaluate it across these dimensions:
1. **Read-aloud rhythm & flow** — Does it sound great when read aloud? Are sentences well-paced?
2. **Age-appropriateness** — Is vocabulary and sentence complexity right for 3–7 year olds?
3. **Sound word consistency** — Are onomatopoeia words used consistently and effectively?
4. **Emotional resonance** — Does the emotional arc feel earned and clear?
5. **Repetition & pattern** — Picture books thrive on repetition. Is it used well?
6. **Grammar & punctuation** — Any errors or inconsistencies?
7. **Word choice** — Any weak, vague, or un-magical words that could be stronger?
8. **Praise** — What's working brilliantly that should be preserved?

Chapter: "${chapter.label}"

Text:
${chapter.text}

Return a structured list of issues. For each issue include:
- severity: one of "error" (must fix), "warning" (should fix), "suggestion" (consider), "praise" (highlight what's great)
- category: short label e.g. "Rhythm", "Word Choice", "Grammar", "Sound Words", "Repetition", "Age-appropriateness", "Emotional Beat", "Praise"
- summary: one short sentence describing the issue
- original: the exact phrase from the text (if applicable, else null)
- suggestion: a concrete rewrite suggestion (if applicable, else null)
- explanation: 1–2 sentences explaining why

Aim for 6–12 items total. Always include at least 2 praise items.`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number', description: 'Overall quality score 1-10' },
          overall_verdict: { type: 'string', description: 'One sentence overall assessment' },
          issues: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                severity: { type: 'string' },
                category: { type: 'string' },
                summary: { type: 'string' },
                original: { type: 'string' },
                suggestion: { type: 'string' },
                explanation: { type: 'string' },
              },
            },
          },
        },
      },
    });
    setResults(result);
    setLoading(false);
  };

  const errors   = results?.issues?.filter(i => i.severity === 'error') || [];
  const warnings = results?.issues?.filter(i => i.severity === 'warning') || [];
  const suggestions = results?.issues?.filter(i => i.severity === 'suggestion') || [];
  const praises  = results?.issues?.filter(i => i.severity === 'praise') || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 bg-amber-50">
          <div>
            <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              AI Proofreader
            </h2>
            <p className="text-xs text-amber-500">Powered by Claude — children's book specialist</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter selector + run */}
        <div className="px-5 py-3 border-b border-amber-100 flex items-center gap-3">
          <select
            value={selectedChapter}
            onChange={e => { setSelectedChapter(e.target.value); setResults(null); }}
            className="flex-1 text-xs rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-amber-900 focus:outline-none focus:border-violet-400"
          >
            {CHAPTER_OPTIONS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={runProofread}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Analysing…' : 'Proofread'}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!results && !loading && (
            <div className="text-center py-12">
              <Sparkles className="w-8 h-8 text-violet-300 mx-auto mb-3" />
              <p className="text-sm text-amber-400">Select a chapter and click Proofread</p>
              <p className="text-xs text-amber-300 mt-1">Uses Claude for deep children's book analysis</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 text-violet-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-amber-600">Reading carefully…</p>
            </div>
          )}

          {results && (
            <>
              {/* Score banner */}
              <div className="rounded-xl bg-gradient-to-r from-violet-50 to-amber-50 border border-violet-200 px-4 py-3 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-violet-700">{results.overall_score}<span className="text-lg text-violet-300">/10</span></p>
                  <p className="text-[10px] text-violet-400 uppercase font-bold">Score</p>
                </div>
                <p className="flex-1 text-xs text-gray-700 leading-snug">{results.overall_verdict}</p>
              </div>

              {/* Summary pills */}
              <div className="flex gap-2 flex-wrap text-xs">
                {errors.length > 0 && <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">{errors.length} error{errors.length !== 1 ? 's' : ''}</span>}
                {warnings.length > 0 && <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">{warnings.length} warning{warnings.length !== 1 ? 's' : ''}</span>}
                {suggestions.length > 0 && <span className="px-2 py-1 rounded-full bg-violet-100 text-violet-700 font-medium">{suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}</span>}
                {praises.length > 0 && <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">{praises.length} praise</span>}
              </div>

              {/* Issues grouped */}
              {[
                { label: 'Errors', items: errors },
                { label: 'Warnings', items: warnings },
                { label: 'Suggestions', items: suggestions },
                { label: '✨ What\'s Working', items: praises },
              ].map(group => group.items.length > 0 && (
                <div key={group.label}>
                  <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">{group.label}</p>
                  <div className="space-y-2">
                    {group.items.map((issue, i) => <IssueCard key={i} issue={issue} />)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}