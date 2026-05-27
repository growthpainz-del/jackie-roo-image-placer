import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DragDropContext } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { SLOTS, SLOTS_MAP } from "@/lib/manuscript";
import { matchFilesToSlots } from "@/lib/bulkMatcher";
import AppHeader from "@/components/AppHeader";
import BookView from "@/components/BookView";
import GalleryView from "@/components/GalleryView";
import ExportView from "@/components/ExportView";
import UnassignedTray from "@/components/UnassignedTray";

const LS_UNASSIGNED = "jackieroo_unassigned";
const LS_BOOKMARK = "jackieroo_bookmark";

function loadUnassigned() {
  try { return JSON.parse(localStorage.getItem(LS_UNASSIGNED) || "[]"); } catch { return []; }
}
function saveUnassigned(items) {
  localStorage.setItem(LS_UNASSIGNED, JSON.stringify(items));
}

export default function Home() {
  const [view, setView] = useState("book");
  const [unassigned, setUnassigned] = useState(loadUnassigned);
  const [selectedUnassigned, setSelectedUnassigned] = useState(null); // url
  const [bulkUploading, setBulkUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: illustrationsRaw = [] } = useQuery({
    queryKey: ["illustrations"],
    queryFn: () => base44.entities.Illustration.list(),
  });

  // Build a map: slot_id → illustration record
  const illustrationsMap = Object.fromEntries(
    illustrationsRaw.map(i => [i.slot_id, i])
  );

  const placedCount = Object.values(illustrationsMap).filter(i => i.image_url).length;

  const saveIllustration = useMutation({
    mutationFn: async ({ slot_id, image_url }) => {
      const existing = illustrationsMap[slot_id];
      const slotMeta = SLOTS_MAP[slot_id] || {};
      if (existing) {
        return base44.entities.Illustration.update(existing.id, {
          image_url, placed_at: new Date().toISOString()
        });
      } else {
        return base44.entities.Illustration.create({
          slot_id,
          chapter: slotMeta.chapter || "",
          label: slotMeta.label || "",
          order_index: slotMeta.order_index || 0,
          image_url,
          placed_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["illustrations"] }),
  });

  const handleAssignToSlot = useCallback(async (slot_id, imageUrl) => {
    await saveIllustration.mutateAsync({ slot_id, image_url: imageUrl });
    // Remove from unassigned if it was there
    setUnassigned(prev => {
      const next = prev.filter(u => u.url !== imageUrl);
      saveUnassigned(next);
      return next;
    });
    setSelectedUnassigned(null);
  }, [saveIllustration]);

  const handleSingleUpload = useCallback(async (slot_id, file) => {
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await saveIllustration.mutateAsync({ slot_id, image_url: file_url });
  }, [saveIllustration]);

  const handleBulkUpload = useCallback(async (files) => {
    setBulkUploading(true);
    const { matched, unmatched: unmatchedFiles } = matchFilesToSlots(Array.from(files), SLOTS);

    // Upload matched files and save to DB
    for (const [slot_id, file] of Object.entries(matched)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await saveIllustration.mutateAsync({ slot_id, image_url: file_url });
    }

    // Upload unmatched files, add to tray
    const newUnassigned = [];
    for (const file of unmatchedFiles) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUnassigned.push({ name: file.name, url: file_url, id: `${Date.now()}-${file.name}` });
    }

    if (newUnassigned.length > 0) {
      setUnassigned(prev => {
        const next = [...prev, ...newUnassigned];
        saveUnassigned(next);
        return next;
      });
    }
    setBulkUploading(false);
  }, [saveIllustration]);

  const handleRemoveUnassigned = useCallback((id) => {
    setUnassigned(prev => {
      const next = prev.filter(u => u.id !== id);
      saveUnassigned(next);
      return next;
    });
    setSelectedUnassigned(null);
  }, []);

  const onDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    // draggableId is the unassigned image id
    // destination.droppableId is either "unassigned-tray" or a slot_id
    if (destination.droppableId !== "unassigned-tray") {
      const img = unassigned.find(u => u.id === draggableId);
      if (img) handleAssignToSlot(destination.droppableId, img.url);
    }
  }, [unassigned, handleAssignToSlot]);

  const bookmark = JSON.parse(localStorage.getItem(LS_BOOKMARK) || "null");

  const handleBookmark = () => {
    localStorage.setItem(LS_BOOKMARK, JSON.stringify({
      scrollY: window.scrollY,
      label: "Scroll position"
    }));
    window.dispatchEvent(new Event("bookmark-set"));
  };

  const handleGoToBookmark = () => {
    if (bookmark) window.scrollTo({ top: bookmark.scrollY, behavior: "smooth" });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="min-h-screen bg-amber-50">
        <AppHeader
          view={view}
          setView={setView}
          placedCount={placedCount}
          totalSlots={33}
          onBulkUpload={handleBulkUpload}
          bulkUploading={bulkUploading}
          bookmark={bookmark}
          onBookmark={handleBookmark}
          onGoToBookmark={handleGoToBookmark}
        />

        <UnassignedTray
          unassigned={unassigned}
          selectedUrl={selectedUnassigned}
          onSelect={setSelectedUnassigned}
          onRemove={handleRemoveUnassigned}
        />

        <main className="max-w-3xl mx-auto px-4 pb-20">
          {view === "book" && (
            <BookView
              illustrationsMap={illustrationsMap}
              onUpload={handleSingleUpload}
              onAssign={handleAssignToSlot}
              selectedUnassigned={selectedUnassigned}
              hasUnassigned={unassigned.length > 0}
            />
          )}
          {view === "gallery" && (
            <GalleryView
              illustrationsMap={illustrationsMap}
              onUpload={handleSingleUpload}
              onAssign={handleAssignToSlot}
              selectedUnassigned={selectedUnassigned}
              hasUnassigned={unassigned.length > 0}
            />
          )}
          {view === "export" && (
            <ExportView illustrationsMap={illustrationsMap} />
          )}
        </main>
      </div>
    </DragDropContext>
  );
}