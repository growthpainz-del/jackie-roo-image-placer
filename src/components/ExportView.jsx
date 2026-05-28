import { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Archive, AlertTriangle, CheckCircle } from 'lucide-react';
import { SLOT_CONFIG, CHAPTER_META } from '@/lib/slotConfig';
import { BOOK_CHAPTERS } from '@/lib/bookContent';

const TRIM_SIZES = {
  '8x8':     { w: 8,   h: 8 },
  '8.5x8.5': { w: 8.5, h: 8.5 },
  '9x9':     { w: 9,   h: 9 },
};
const BLEED = 0.125;

async function loadImageAsDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export default function ExportView({ illustrationMap }) {
  const [trimSize, setTrimSize] = useState('8.5x8.5');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  const placedSlots = SLOT_CONFIG.filter(s => illustrationMap[s.slot_id]?.image_url);
  const totalPlaced = placedSlots.length;

  const handlePdfExport = async () => {
    setPdfLoading(true);
    const { w, h } = TRIM_SIZES[trimSize];
    const pageW = w + BLEED * 2;
    const pageH = h + BLEED * 2;
    const doc = new jsPDF({ unit: 'in', format: [pageW, pageH], orientation: 'portrait' });
    let firstPage = true;

    for (const chapter of BOOK_CHAPTERS) {
      for (const block of chapter.blocks) {
        if (block.type === 'slot') {
          const illus = illustrationMap[block.slot_id];
          if (!firstPage) doc.addPage([pageW, pageH]);
          firstPage = false;
          if (illus?.image_url) {
            const dataUrl = await loadImageAsDataUrl(illus.image_url);
            doc.addImage(dataUrl, 'JPEG', 0, 0, pageW, pageH);
          } else {
            doc.setFillColor(240, 235, 220);
            doc.rect(0, 0, pageW, pageH, 'F');
            doc.setFontSize(10);
            doc.setTextColor(160, 120, 80);
            doc.text(`[EMPTY: ${block.slot_id}]`, pageW / 2, pageH / 2, { align: 'center' });
            doc.setFontSize(7);
            const lines = doc.splitTextToSize(block.label, pageW - 1);
            doc.text(lines, pageW / 2, pageH / 2 + 0.3, { align: 'center' });
          }
        } else if (block.type === 'text') {
          if (!firstPage) doc.addPage([pageW, pageH]);
          firstPage = false;

          // Warm parchment background
          doc.setFillColor(255, 248, 230);
          doc.rect(0, 0, pageW, pageH, 'F');

          // Decorative top band
          doc.setFillColor(210, 140, 60);
          doc.rect(0, 0, pageW, 0.18, 'F');
          // Decorative bottom band
          doc.setFillColor(210, 140, 60);
          doc.rect(0, pageH - 0.18, pageW, 0.18, 'F');

          // Thin inner lines
          doc.setDrawColor(210, 140, 60);
          doc.setLineWidth(0.015);
          doc.line(0.25, 0.28, pageW - 0.25, 0.28);
          doc.line(0.25, pageH - 0.28, pageW - 0.25, pageH - 0.28);

          // Parse text: split on sound effects in (parens)
          const rawText = block.content;
          const sfxPalette = [
            [220, 80, 40],   // red-orange
            [40, 150, 180],  // teal
            [180, 60, 160],  // purple
            [60, 160, 80],   // green
            [220, 160, 20],  // golden
          ];
          let sfxColorIndex = 0;

          // Segment into normal text and sound effects
          const segments = [];
          const sfxRegex = /(\([^)]+\))/g;
          let lastIdx = 0;
          let match;
          while ((match = sfxRegex.exec(rawText)) !== null) {
            if (match.index > lastIdx) {
              segments.push({ kind: 'text', value: rawText.slice(lastIdx, match.index) });
            }
            segments.push({ kind: 'sfx', value: match[1] });
            lastIdx = match.index + match[0].length;
          }
          if (lastIdx < rawText.length) {
            segments.push({ kind: 'text', value: rawText.slice(lastIdx) });
          }

          // Build display text with sfx markers replaced by ALLCAPS for sizing
          const displayText = segments.map(s =>
            s.kind === 'sfx' ? s.value.toUpperCase() : s.value
          ).join('');

          const margin = 0.75;
          const textW = pageW - margin * 2;
          const bodySize = 18;
          doc.setFontSize(bodySize);
          const allLines = doc.splitTextToSize(displayText, textW);
          const lineH = 0.3;
          const totalH = allLines.length * lineH;
          let startY = (pageH - totalH) / 2 + 0.1;

          // Draw each line, colouring sfx segments inline
          // For simplicity, draw full lines in body colour, then overlay sfx in colour
          doc.setFontSize(bodySize);
          doc.setTextColor(80, 45, 15);
          doc.text(allLines, pageW / 2, startY, { align: 'center', lineHeightFactor: 1.5 });

          // Now overlay sound effects in colour + slightly bigger
          // Re-parse to find sfx and draw over the top
          let sfxIdx = 0;
          for (const seg of segments) {
            if (seg.kind !== 'sfx') continue;
            const sfxColor = sfxPalette[sfxIdx % sfxPalette.length];
            sfxIdx++;

            const sfxDisplay = seg.value.toUpperCase();
            // Find which line(s) contain this sfx by searching allLines
            for (let li = 0; li < allLines.length; li++) {
              if (allLines[li].includes(sfxDisplay.replace(/[()]/g, c => c))) {
                const lineY = startY + li * lineH * 1.5;
                // Draw a soft pill behind the sfx word
                doc.setFontSize(bodySize + 2);
                doc.setTextColor(...sfxColor);
                // Find x position: measure text before sfx on this line
                const lineText = allLines[li];
                const sfxPos = lineText.indexOf(sfxDisplay.slice(0, 4));
                if (sfxPos >= 0) {
                  const before = lineText.slice(0, sfxPos);
                  const beforeW = doc.getTextWidth(before);
                  const sfxW = doc.getTextWidth(sfxDisplay);
                  const lineFullW = doc.getTextWidth(lineText);
                  const lineStartX = pageW / 2 - lineFullW / 2;
                  const sfxX = lineStartX + beforeW + sfxW / 2;

                  // Pill background
                  const pillPad = 0.04;
                  doc.setFillColor(...sfxColor.map(c => Math.min(255, c + 170)));
                  doc.roundedRect(sfxX - sfxW / 2 - pillPad, lineY - 0.18, sfxW + pillPad * 2, 0.24, 0.04, 0.04, 'F');

                  // Coloured text
                  doc.text(sfxDisplay, sfxX, lineY, { align: 'center' });
                }
                break;
              }
            }
          }
          doc.setFontSize(bodySize);
          doc.setTextColor(80, 45, 15);
        }
      }
    }

    const date = new Date().toISOString().slice(0, 10);
    doc.save(`JackieRoo_KDP_${date}.pdf`);
    setPdfLoading(false);
  };

  const handleZipExport = async () => {
    setZipLoading(true);
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const chapterGroups = {};
    for (const slot of placedSlots) {
      const ch = slot.chapter;
      if (!chapterGroups[ch]) chapterGroups[ch] = [];
      chapterGroups[ch].push(slot);
    }
    for (const [chapter, slots] of Object.entries(chapterGroups)) {
      const folder = zip.folder(chapter);
      for (const slot of slots) {
        const url = illustrationMap[slot.slot_id]?.image_url;
        if (!url) continue;
        const res = await fetch(url);
        const blob = await res.blob();
        const ext = blob.type.includes('png') ? 'png' : 'jpg';
        folder.file(`${String(slot.order_index).padStart(3, '0')}_${slot.slot_id}.${ext}`, blob);
      }
    }
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = `JackieRoo_Canva_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    setZipLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-amber-900 mb-1">Export</h2>
        <p className="text-amber-600 text-sm">{totalPlaced} of 33 illustrations placed</p>
      </div>

      {/* Trim size selector */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <p className="text-sm font-semibold text-amber-800 mb-2">PDF Trim Size</p>
        <div className="flex gap-2">
          {Object.keys(TRIM_SIZES).map(size => (
            <button key={size} onClick={() => setTrimSize(size)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${trimSize === size ? 'bg-amber-700 text-white' : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-100'}`}>
              {size}"
            </button>
          ))}
        </div>
        <p className="text-xs text-amber-500 mt-2">Bleed: 0.125" all sides · Full-bleed illustration pages</p>
      </div>

      {/* Chapter overview */}
      <div className="space-y-3">
        {BOOK_CHAPTERS.map(chapter => {
          const slots = SLOT_CONFIG.filter(s => s.chapter === chapter.chapterKey);
          const placed = slots.filter(s => illustrationMap[s.slot_id]?.image_url).length;
          return (
            <div key={chapter.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
              {placed === slots.length
                ? <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                : <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-900">{chapter.title} — {chapter.subtitle}</p>
              </div>
              <span className="text-xs text-amber-600 font-mono">{placed}/{slots.length}</span>
            </div>
          );
        })}
      </div>

      {/* Export buttons */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={handlePdfExport}
          disabled={pdfLoading}
          className="flex flex-col items-center gap-2 p-6 rounded-xl bg-amber-700 hover:bg-amber-800 text-white transition-colors disabled:opacity-60"
        >
          <FileText className="w-8 h-8" />
          <span className="font-bold">{pdfLoading ? 'Generating…' : 'Export KDP PDF'}</span>
          <span className="text-xs text-amber-200">{trimSize}" · full-bleed · JackieRoo_KDP_[date].pdf</span>
        </button>
        <button
          onClick={handleZipExport}
          disabled={zipLoading}
          className="flex flex-col items-center gap-2 p-6 rounded-xl bg-teal-700 hover:bg-teal-800 text-white transition-colors disabled:opacity-60"
        >
          <Archive className="w-8 h-8" />
          <span className="font-bold">{zipLoading ? 'Zipping…' : 'Export Canva ZIP'}</span>
          <span className="text-xs text-teal-200">One folder per chapter · JackieRoo_Canva_[date].zip</span>
        </button>
      </div>
    </div>
  );
}