import { useState } from 'react';
import { X, Download, Loader2, BookOpen, CheckSquare, Square } from 'lucide-react';
import { BOOK_CHAPTERS } from '@/lib/bookContent';
import { jsPDF } from 'jspdf';

const PARCHMENT = [252, 248, 240];
const DARK = [60, 40, 20];
const AMBER = [180, 120, 40];

async function toDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function generatePDF(selectedChapterIds, illustrationMap, onProgress) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297;
  const margin = 14;

  // Title page
  doc.setFillColor(...PARCHMENT);
  doc.rect(0, 0, W, H, 'F');
  doc.setTextColor(...AMBER);
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.text('Jackie Roo &', W / 2, 100, { align: 'center' });
  doc.text('The Rainy Day Robots', W / 2, 115, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('times', 'italic');
  doc.setTextColor(...DARK);
  doc.text('by Amber Dawn', W / 2, 130, { align: 'center' });

  const chapters = BOOK_CHAPTERS.filter(ch => selectedChapterIds.includes(ch.id));
  let totalBlocks = chapters.reduce((acc, ch) => acc + ch.blocks.filter(b => b.type !== 'pageturn').length, 0);
  let done = 0;

  for (const chapter of chapters) {
    // Chapter header page
    doc.addPage();
    doc.setFillColor(...PARCHMENT);
    doc.rect(0, 0, W, H, 'F');
    doc.setDrawColor(...AMBER);
    doc.setLineWidth(0.5);
    doc.rect(margin, margin, W - margin * 2, H - margin * 2);
    doc.setTextColor(...AMBER);
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text(chapter.title, W / 2, H / 2 - 8, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('times', 'italic');
    doc.setTextColor(...DARK);
    doc.text(chapter.subtitle, W / 2, H / 2 + 6, { align: 'center' });

    // Pair slots with following text blocks
    const blocks = chapter.blocks.filter(b => b.type !== 'pageturn');
    let i = 0;
    while (i < blocks.length) {
      const block = blocks[i];

      if (block.type === 'slot') {
        const nextBlock = blocks[i + 1]?.type === 'text' ? blocks[i + 1] : null;
        const illus = illustrationMap[block.slot_id];
        const isReveal = block.slot_id?.includes('-reveal') || block.slot_id?.includes('finale-');

        doc.addPage();
        doc.setFillColor(...PARCHMENT);
        doc.rect(0, 0, W, H, 'F');

        // Image area
        const imgY = margin;
        const imgH = nextBlock ? H * 0.58 : H - margin * 2;
        const imgW = W - margin * 2;

        if (illus?.image_url) {
          const dataUrl = await toDataUrl(illus.image_url);
          if (dataUrl) {
            doc.addImage(dataUrl, 'JPEG', margin, imgY, imgW, imgH, undefined, 'FAST');
          }
        } else {
          // Placeholder box
          doc.setFillColor(230, 220, 200);
          doc.rect(margin, imgY, imgW, imgH, 'F');
          doc.setDrawColor(...AMBER);
          doc.setLineWidth(0.3);
          doc.rect(margin, imgY, imgW, imgH);
          doc.setTextColor(160, 130, 80);
          doc.setFontSize(8);
          doc.setFont('times', 'italic');
          const labelLines = doc.splitTextToSize(block.label, imgW - 8);
          doc.text(labelLines, W / 2, imgY + imgH / 2, { align: 'center' });
        }

        // Reveal badge
        if (isReveal) {
          doc.setFillColor(...AMBER);
          doc.roundedRect(margin, imgY + imgH - 8, 22, 6, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(6);
          doc.setFont('times', 'bold');
          doc.text('REVEAL', margin + 11, imgY + imgH - 4, { align: 'center' });
        }

        // Text area
        if (nextBlock) {
          const textY = imgY + imgH + 6;
          doc.setDrawColor(...AMBER);
          doc.setLineWidth(0.3);
          doc.line(margin + 10, textY - 2, W - margin - 10, textY - 2);
          doc.setTextColor(...DARK);
          doc.setFontSize(10);
          doc.setFont('times', 'normal');
          const lines = doc.splitTextToSize(nextBlock.content, imgW);
          doc.text(lines, margin, textY + 4);
          i += 2; // consumed both
        } else {
          i += 1;
        }

      } else if (block.type === 'text') {
        // Standalone text page (shouldn't often happen, but handle it)
        doc.addPage();
        doc.setFillColor(...PARCHMENT);
        doc.rect(0, 0, W, H, 'F');
        doc.setTextColor(...DARK);
        doc.setFontSize(12);
        doc.setFont('times', 'normal');
        const lines = doc.splitTextToSize(block.content, W - margin * 2);
        doc.text(lines, margin, H / 2 - (lines.length * 6) / 2);
        i += 1;
      } else {
        i += 1;
      }

      done++;
      onProgress(Math.round((done / totalBlocks) * 100));
    }
  }

  const filename = selectedChapterIds.length === BOOK_CHAPTERS.length
    ? 'JackieRoo-FullBook.pdf'
    : `JackieRoo-${selectedChapterIds.map(id => id.replace('ch', 'Ch').replace('finale', 'Finale')).join('-')}.pdf`;

  doc.save(filename);
}

export default function PDFExportModal({ illustrationMap, onClose }) {
  const [selected, setSelected] = useState(new Set(BOOK_CHAPTERS.map(ch => ch.id)));
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(prev =>
      prev.size === BOOK_CHAPTERS.length ? new Set() : new Set(BOOK_CHAPTERS.map(ch => ch.id))
    );
  };

  const handleExport = async () => {
    if (selected.size === 0) return;
    setExporting(true);
    setProgress(0);
    await generatePDF([...selected], illustrationMap, setProgress);
    setExporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-parchment rounded-2xl shadow-2xl w-full max-w-sm border border-amber-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <h2 className="font-bold text-amber-900 text-sm">Export as PDF</h2>
          </div>
          <button onClick={onClose} className="text-amber-500 hover:text-amber-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter selector */}
        <div className="px-5 py-4 space-y-2">
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs text-amber-700 hover:text-amber-900 font-medium mb-3"
          >
            {selected.size === BOOK_CHAPTERS.length
              ? <CheckSquare className="w-3.5 h-3.5" />
              : <Square className="w-3.5 h-3.5" />}
            {selected.size === BOOK_CHAPTERS.length ? 'Deselect all' : 'Select all'}
          </button>
          {BOOK_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => toggle(ch.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selected.has(ch.id)
                  ? 'bg-amber-800 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              {selected.has(ch.id)
                ? <CheckSquare className="w-3.5 h-3.5 flex-shrink-0" />
                : <Square className="w-3.5 h-3.5 flex-shrink-0" />}
              <div>
                <div className="text-xs font-semibold">{ch.title}</div>
                <div className={`text-xs ${selected.has(ch.id) ? 'text-amber-200' : 'text-amber-500'}`}>{ch.subtitle}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-4">
          {exporting && (
            <div className="mb-3">
              <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600 transition-all duration-200 rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-amber-600 mt-1 text-center">Generating… {progress}%</p>
            </div>
          )}
          <button
            onClick={handleExport}
            disabled={exporting || selected.size === 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? 'Generating PDF…' : `Export ${selected.size} chapter${selected.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}