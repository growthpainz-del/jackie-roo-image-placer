import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { SLOT_CONFIG } from '@/lib/slotConfig';
import { normalizeDriveUrl } from '@/lib/driveUrl';
import { Link } from 'react-router-dom';
import { ArrowLeft, Upload, Sparkles, CheckCircle, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

function getUnassigned() {
  try { return JSON.parse(localStorage.getItem('jr_unassigned') || '[]'); } catch { return []; }
}
function saveUnassigned(items) {
  localStorage.setItem('jr_unassigned', JSON.stringify(items));
}

const SLOT_LABELS_TEXT = SLOT_CONFIG.map(s => `${s.slot_id}: ${s.label}`).join('\n');

async function aiSuggest(imageUrl, imageName, extraKeywords = '') {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are helping to place illustration images into the correct slots of a children's picture book called "Jackie Roo & The Rainy Day Robots".

The image filename is: "${imageName}"
${extraKeywords ? `\nExtra keywords / context provided by the user: ${extraKeywords}\n` : ''}
Here are all the available illustration slots with their descriptions:
${SLOT_LABELS_TEXT}

Based on the image content you can see, the filename, and any extra keywords, identify the TOP 3 best matching slots for this image.
Return ONLY slot_ids from the list above — do not invent new ones.`,
    file_urls: [imageUrl],
    response_json_schema: {
      type: 'object',
      properties: {
        top_matches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              slot_id: { type: 'string' },
              confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  });
  return result.top_matches || [];
}

// ── component ─────────────────────────────────────────────────────────────────

export default function AssetManager() {
  const queryClient = useQueryClient();
  const [assets, setAssets] = useState(() => getUnassigned());
  const [suggestions, setSuggestions] = useState({}); // { assetId: [{slot_id, confidence, reason}] }
  const [analyzing, setAnalyzing] = useState({}); // { assetId: true }
  const [placing, setPlacing] = useState({}); // { assetId-slotId: true }
  const [placed, setPlaced] = useState({}); // { assetId: slot_id }
  const [keywords, setKeywords] = useState({}); // { assetId: string }
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: illustrations = [] } = useQuery({
    queryKey: ['illustrations'],
    queryFn: () => base44.entities.Illustration.list(),
  });
  const illustrationMap = Object.fromEntries(illustrations.map(i => [i.slot_id, i]));

  // ── upload ──
  const handleFiles = useCallback(async (files) => {
    setUploading(true);
    const newItems = await Promise.all(
      Array.from(files).filter(f => f.type.startsWith('image/')).map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { id: `${Date.now()}-${file.name}`, name: file.name, url: normalizeDriveUrl(file_url) };
      })
    );
    const updated = [...assets, ...newItems];
    setAssets(updated);
    saveUnassigned(updated);
    setUploading(false);
  }, [assets]);

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); };
  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  // ── AI suggest ──
  const handleAnalyze = useCallback(async (asset) => {
    setAnalyzing(prev => ({ ...prev, [asset.id]: true }));
    const matches = await aiSuggest(asset.url, asset.name, keywords[asset.id] || '');
    setSuggestions(prev => ({ ...prev, [asset.id]: matches }));
    setAnalyzing(prev => ({ ...prev, [asset.id]: false }));
  }, [keywords]);

  const handleAnalyzeAll = useCallback(async () => {
    const unanalyzed = assets.filter(a => !suggestions[a.id] && !placed[a.id]);
    for (const asset of unanalyzed) {
      await handleAnalyze(asset);
    }
  }, [assets, suggestions, placed, handleAnalyze]);

  // ── place ──
  const handlePlace = useCallback(async (asset, slotId) => {
    const key = `${asset.id}-${slotId}`;
    setPlacing(prev => ({ ...prev, [key]: true }));
    const slot = SLOT_CONFIG.find(s => s.slot_id === slotId);
    const existing = illustrationMap[slotId];
    if (existing) {
      await base44.entities.Illustration.update(existing.id, { image_url: asset.url, placed_at: new Date().toISOString() });
    } else {
      await base44.entities.Illustration.create({
        slot_id: slotId,
        chapter: slot?.chapter || '',
        label: slot?.label || '',
        order_index: slot?.order_index || 0,
        image_url: asset.url,
        placed_at: new Date().toISOString(),
      });
    }
    // Remove from unassigned tray
    const updated = assets.filter(a => a.id !== asset.id);
    setAssets(updated);
    saveUnassigned(updated);
    setPlaced(prev => ({ ...prev, [asset.id]: slotId }));
    setPlacing(prev => ({ ...prev, [key]: false }));
    queryClient.invalidateQueries({ queryKey: ['illustrations'] });
  }, [assets, illustrationMap, queryClient]);

  const handleRemove = useCallback((id) => {
    const updated = assets.filter(a => a.id !== id);
    setAssets(updated);
    saveUnassigned(updated);
    setSuggestions(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, [assets]);

  const pendingCount = assets.filter(a => !placed[a.id]).length;
  const analyzedCount = assets.filter(a => suggestions[a.id] && !placed[a.id]).length;

  return (
    <div className="min-h-screen bg-cream font-book">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-parchment border-b border-amber-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-amber-700 hover:text-amber-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-amber-900">Asset Manager</h1>
              <p className="text-xs text-amber-600">{pendingCount} unplaced · {analyzedCount} analysed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <button
                onClick={handleAnalyzeAll}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Match All
              </button>
            )}
            <label className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-medium cursor-pointer transition-colors">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Upload
              <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFiles(e.target.files)} />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Drop zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragging ? 'border-amber-500 bg-amber-50' : 'border-amber-200 bg-parchment'
          }`}
        >
          <Upload className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-amber-600">Drop images here or use the Upload button above</p>
        </div>

        {/* Asset grid */}
        {assets.length === 0 ? (
          <div className="text-center py-16 text-amber-400">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No assets yet. Upload some images to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assets.map(asset => {
              const isPlaced = !!placed[asset.id];
              const isAnalyzing = analyzing[asset.id];
              const assetSuggestions = suggestions[asset.id] || [];

              return (
                <div key={asset.id} className={`rounded-xl border overflow-hidden ${isPlaced ? 'border-green-300 bg-green-50' : 'border-amber-200 bg-white'}`}>
                  <div className="flex gap-4 p-4">
                    {/* Thumbnail */}
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0 bg-amber-50"
                    />

                    {/* Info + actions */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-xs font-medium text-amber-900 truncate">{asset.name}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isPlaced ? (
                            <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                              <CheckCircle className="w-3.5 h-3.5" /> Placed
                            </span>
                          ) : (
                            <>
                              {/* Keywords input */}
                              <input
                                type="text"
                                value={keywords[asset.id] || ''}
                                onChange={e => setKeywords(prev => ({ ...prev, [asset.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === 'Enter' && !isAnalyzing) handleAnalyze(asset); }}
                                placeholder="Keywords (e.g. scotch bot, puddle)…"
                                className="text-xs px-2 py-1 rounded border border-amber-200 bg-amber-50 placeholder-amber-300 text-amber-900 focus:outline-none focus:border-violet-400 w-44"
                              />
                              <button
                                onClick={() => handleAnalyze(asset)}
                                disabled={isAnalyzing}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-violet-100 hover:bg-violet-200 text-violet-800 font-medium disabled:opacity-50 transition-colors"
                              >
                                {isAnalyzing
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : assetSuggestions.length > 0
                                    ? <RefreshCw className="w-3 h-3" />
                                    : <Sparkles className="w-3 h-3" />}
                                {isAnalyzing ? 'Analysing…' : assetSuggestions.length > 0 ? 'Re-analyse' : 'AI Match'}
                              </button>
                              <button onClick={() => handleRemove(asset.id)} className="text-amber-400 hover:text-red-500 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Suggestions */}
                      {!isPlaced && assetSuggestions.length > 0 && (
                        <div className="space-y-1.5">
                          {assetSuggestions.map((s, idx) => {
                            const slot = SLOT_CONFIG.find(sl => sl.slot_id === s.slot_id);
                            const alreadyFilled = !!illustrationMap[s.slot_id]?.image_url;
                            const pKey = `${asset.id}-${s.slot_id}`;
                            const isPlacing = placing[pKey];
                            return (
                              <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                                idx === 0 ? 'bg-violet-50 border border-violet-200' : 'bg-gray-50 border border-gray-200'
                              }`}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                      s.confidence === 'high' ? 'bg-green-100 text-green-700' :
                                      s.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                                      'bg-gray-100 text-gray-600'
                                    }`}>{s.confidence}</span>
                                    <span className="font-mono text-gray-500 truncate">{s.slot_id}</span>
                                    {alreadyFilled && <AlertCircle className="w-3 h-3 text-orange-400 flex-shrink-0" title="Slot already filled" />}
                                  </div>
                                  <p className="text-gray-500 leading-tight line-clamp-2">{s.reason}</p>
                                </div>
                                <button
                                  onClick={() => handlePlace(asset, s.slot_id)}
                                  disabled={isPlacing}
                                  className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-amber-700 hover:bg-amber-800 text-white font-medium disabled:opacity-50 transition-colors"
                                >
                                  {isPlacing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                  Place
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!isPlaced && assetSuggestions.length === 0 && !isAnalyzing && (
                        <p className="text-xs text-amber-400 italic">Click "AI Match" to get placement suggestions</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}