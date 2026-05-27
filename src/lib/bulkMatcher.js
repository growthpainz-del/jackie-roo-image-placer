/**
 * Matches uploaded files to illustration slots using three strategies:
 * 1. Exact slot_id match
 * 2. Filename contains slot_id (or vice versa)
 * 3. Fuzzy keyword match against slot label
 */
export function matchImages(files, slots) {
  const matched = {}; // slot_id -> File
  const unmatched = [];

  for (const file of files) {
    const baseName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[_\s]+/g, '-');
    let found = false;

    // 1. Exact slot_id match
    const exact = slots.find(s => s.slot_id.toLowerCase() === baseName);
    if (exact && !matched[exact.slot_id]) {
      matched[exact.slot_id] = file;
      found = true;
    }

    if (!found) {
      // 2. Filename contains slot_id or slot_id contains filename part
      const partial = slots.find(s =>
        baseName.includes(s.slot_id.toLowerCase()) ||
        s.slot_id.toLowerCase().includes(baseName)
      );
      if (partial && !matched[partial.slot_id]) {
        matched[partial.slot_id] = file;
        found = true;
      }
    }

    if (!found) {
      // 3. Fuzzy keyword match against label
      const keywords = baseName.split(/[-_\s]+/).filter(k => k.length > 2);
      let best = null;
      let bestScore = 0;
      for (const slot of slots) {
        const labelWords = slot.label.toLowerCase().split(/\s+/);
        const score = keywords.filter(k => labelWords.some(w => w.includes(k) || k.includes(w))).length;
        if (score > bestScore) { bestScore = score; best = slot; }
      }
      if (best && bestScore > 0 && !matched[best.slot_id]) {
        matched[best.slot_id] = file;
        found = true;
      }
    }

    if (!found) unmatched.push(file);
  }

  return { matched, unmatched };
}