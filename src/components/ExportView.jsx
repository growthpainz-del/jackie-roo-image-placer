import { useState } from "react";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { MANUSCRIPT, SLOTS } from "@/lib/manuscript";
import { FileDown, Package, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRIM_SIZES = {
  "8x8": { w: 8, h: 8, label: '8" × 8"' },
  "8.5x8.5": { w: 8.5, h: 8.5, label: '8.5" × 8.5"' },
  "9x9": { w: 9, h: 9, label: '9" × 9"' },
};
const BLEED = 0.125;

export default function ExportView({ illustrationsMap }) {
  const [trimSize, setTrimSize] = useState("8.5x8.5");
  const [pdfStatus, setPdfStatus] = useState(null); // null | 'loading' | 'done'
  const [zipStatus, setZipStatus] = useState(null);

  const placedSlots = SLOTS.filter(s => illustrationsMap[s.slot_id]?.image_url);
  const allChapters = MANUSCRIPT.chapters;

  const handlePDF = async () => {
    setPdfStatus("loading");
    const { w, h } = TRIM_SIZES[trimSize];
    const totalW = w + BLEED * 2;
    const totalH = h + BLEED * 2;
    const doc = new jsPDF({ unit: "in", format: [totalW, totalH], orientation: "portrait" });

    let first = true;
    for (const chapter of allChapters) {
      for (const block of chapter.blocks) {
        if (block.type === "slot") {
          const record = illustrationsMap[block.slot_id];
          if (!record?.image_url) continue;

          if (!first) doc.addPage([totalW, totalH], "portrait");
          first = false;

          // Load image as base64
          const res = await fetch(record.image_url);
          const blob = await res.blob();
          const b64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          const format = blob.type.includes("png") ? "PNG" : "JPEG";
          doc.addImage(b64, format, 0, 0, totalW, totalH);
        } else if (block.type === "text" && !first) {
          doc.addPage([totalW, totalH], "portrait");
          doc.setFontSize(14);
          doc.setFont("times", "normal");
          const lines = doc.splitTextToSize(block.content, w - 1);
          doc.text(lines, totalW / 2, totalH / 2, { align: "center", baseline: "middle" });
        }
      }
    }

    const date = new Date().toISOString().slice(0, 10);
    doc.save(`JackieRoo_KDP_${date}.pdf`);
    setPdfStatus("done");
    setTimeout(() => setPdfStatus(null), 3000);
  };

  const handleZIP = async () => {
    setZipStatus("loading");
    const zip = new JSZip();

    for (const chapter of allChapters) {
      const chapterSlots = chapter.blocks.filter(b => b.type === "slot");
      const folder = zip.folder(`${chapter.id}_${chapter.subtitle.replace(/\s+/g, "-")}`);

      for (const block of chapterSlots) {
        const record = illustrationsMap[block.slot_id];
        if (!record?.image_url) continue;

        const res = await fetch(record.image_url);
        const blob = await res.blob();
        const ext = blob.type.includes("png") ? "png" : "jpg";
        folder.file(`${block.slot_id}.${ext}`, blob);
      }
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = `JackieRoo_Canva_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setZipStatus("done");
    setTimeout(() => setZipStatus(null), 3000);
  };

  return (
    <div className="py-8 space-y-6">
      <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-amber-900 mb-1">Export</h2>
        <p className="text-sm text-amber-600 mb-4">{placedSlots.length} of 33 slots have images placed.</p>

        {/* Trim size */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-amber-800 mb-2">Trim Size</label>
          <div className="flex gap-2">
            {Object.entries(TRIM_SIZES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setTrimSize(key)}
                className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-colors ${
                  trimSize === key
                    ? "border-amber-600 bg-amber-600 text-white"
                    : "border-amber-200 text-amber-700 hover:border-amber-400"
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-amber-500 mt-1">0.125" bleed on all sides applied automatically</p>
        </div>

        {/* Export buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={handlePDF}
            disabled={pdfStatus === "loading" || placedSlots.length === 0}
            className="bg-amber-800 hover:bg-amber-700 text-white h-12 flex items-center gap-2"
          >
            {pdfStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> :
             pdfStatus === "done" ? <CheckCircle className="w-4 h-4" /> :
             <FileDown className="w-4 h-4" />}
            KDP-Ready PDF
          </Button>
          <Button
            onClick={handleZIP}
            disabled={zipStatus === "loading" || placedSlots.length === 0}
            variant="outline"
            className="border-amber-300 text-amber-800 hover:bg-amber-50 h-12 flex items-center gap-2"
          >
            {zipStatus === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> :
             zipStatus === "done" ? <CheckCircle className="w-4 h-4" /> :
             <Package className="w-4 h-4" />}
            Canva ZIP (by chapter)
          </Button>
        </div>
      </div>

      {/* Chapter summary */}
      <div className="space-y-3">
        {allChapters.map((chapter) => {
          const slots = chapter.blocks.filter(b => b.type === "slot");
          const placed = slots.filter(b => illustrationsMap[b.slot_id]?.image_url);
          return (
            <div key={chapter.id} className="bg-white rounded-xl border border-amber-100 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 bg-amber-50">
                <div>
                  <span className="font-semibold text-amber-900 text-sm">{chapter.title}</span>
                  <span className="text-amber-600 text-sm ml-2">— {chapter.subtitle}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  placed.length === slots.length
                    ? "bg-green-100 text-green-700"
                    : placed.length === 0
                    ? "bg-amber-100 text-amber-600"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {placed.length}/{slots.length}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 p-3">
                {slots.map((block) => {
                  const record = illustrationsMap[block.slot_id];
                  return (
                    <div
                      key={block.slot_id}
                      title={block.label}
                      className={`rounded aspect-square flex items-center justify-center text-[8px] font-bold border ${
                        record?.image_url
                          ? "bg-green-400 border-green-500 text-white"
                          : "bg-amber-100 border-dashed border-amber-300 text-amber-400"
                      }`}
                    >
                      {record?.image_url ? "✓" : <AlertTriangle className="w-2.5 h-2.5" />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}