/**
 * Match uploaded files to slots using 3-tier strategy:
 * 1. Exact slot_id match (filename without extension)
 * 2. Chapter prefix / contains match
 * 3. Fuzzy keyword match against slot label
 */
export function matchFilesToSlots(files, slots) {
  const matched = {}; // slot_id → File
  const unmatched = [];

  for (const file of files) {
    const base = file.name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[\s_]+/g, "-");
    let found = false;

    // 1. Exact slot_id match
    const exact = slots.find(s => s.slot_id.toLowerCase() === base);
    if (exact && !matched[exact.slot_id]) {
      matched[exact.slot_id] = file;
      found = true;
    }

    // 2. Slot_id contained in filename or vice versa
    if (!found) {
      const partial = slots.find(s =>
        base.includes(s.slot_id.toLowerCase()) ||
        s.slot_id.toLowerCase().includes(base)
      );
      if (partial && !matched[partial.slot_id]) {
        matched[partial.slot_id] = file;
        found = true;
      }
    }

    // 3. Fuzzy keyword match against label
    if (!found) {
      const keywords = base.split(/[-_\s]+/).filter(k => k.length > 2);
      let bestSlot = null;
      let bestScore = 0;

      for (const slot of slots) {
        const labelWords = slot.label.toLowerCase().split(/\s+/);
        const score = keywords.filter(k =>
          labelWords.some(w => w.includes(k) || k.includes(w))
        ).length;
        if (score > bestScore) {
          bestScore = score;
          bestSlot = slot;
        }
      }

      if (bestScore >= 1 && bestSlot && !matched[bestSlot.slot_id]) {
        matched[bestSlot.slot_id] = file;
        found = true;
      }
    }

    if (!found) {
      unmatched.push(file);
    }
  }

  return { matched, unmatched };
}