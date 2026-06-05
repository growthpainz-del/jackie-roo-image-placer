import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DragDropContext } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { SLOT_CONFIG } from '@/lib/slotConfig';
import { matchImages } from '@/lib/bulkMatcher';
import AppHeader from '@/components/AppHeader';
import BookView from '@/components/BookView';
import GalleryView from '@/components/GalleryView';
import ExportView from '@/components/ExportView';
import UnassignedTray from '@/components/UnassignedTray';
import BulkUploadModal from '@/components/BulkUploadModal';
import ChapterIndex from '@/components/ChapterIndex';
import StoryArc from '@/components/StoryArc';
import ProofReader from '@/components/ProofReader';

export default function Home() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('book');
  const [unassigned, setUnassigned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jr_unassigned') || '[]'); } catch { return []; }
  });
  const [selectedUnassigned, setSelectedUnassigned] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showProofReader, setShowProofReader] = useState(false);
  const [bookmark, setBookmark] = useState(() => localStorage.getItem('jr_bookmark') ? Number(localStorage.getItem('jr_bookmark')) : null);
  const [bookmarkChapter, setBookmarkChapter] = useState(() => localStorage.getItem('jr_bookmark_chapter') || null);
  const scrollRef = useRef(null);

  const { data: illustrations = [] } = useQuery({
    queryKey: ['illustrations'],
    queryFn: () => base44.entities.Illustration.list(),
  });

  // Keyed map: slot_id -> illustration record
  const illustrationMap = Object.fromEntries(illustrations.map(i => [i.slot_id, i]));

  const placedCount = illustrations.filter(i => i.image_url).length;

  // Persist unassigned to localStorage
  useEffect(() => {
    localStorage.setItem('jr_unassigned', JSON.stringify(unassigned));
  }, [unassigned]);

  // Restore scroll on load
  useEffect(() => {
    const saved = localStorage.getItem('jr_scroll');
    if (saved && scrollRef.current) {
      setTimeout(() => { window.scrollTo(0, Number(saved)); }, 100);
    }
  }, []);

  const handleUpload = useCallback(async (slotId, file) => {
    const slot = SLOT_CONFIG.find(s => s.slot_id === slotId);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existing = illustrationMap[slotId];
    if (existing) {
      await base44.entities.Illustration.update(existing.id, { image_url: file_url, placed_at: new Date().toISOString() });
    } else {
      await base44.entities.Illustration.create({
        slot_id: slotId,
        chapter: slot?.chapter || '',
        label: slot?.label || '',
        order_index: slot?.order_index || 0,
        image_url: file_url,
        placed_at: new Date().toISOString(),
      });
    }
    queryClient.invalidateQueries({ queryKey: ['illustrations'] });
  }, [illustrationMap, queryClient]);

  const handleAssignFromTray = useCallback(async (slotId, unassignedItem) => {
    const slot = SLOT_CONFIG.find(s => s.slot_id === slotId);
    const existing = illustrationMap[slotId];
    if (existing) {
      await base44.entities.Illustration.update(existing.id, { image_url: unassignedItem.url, placed_at: new Date().toISOString() });
    } else {
      await base44.entities.Illustration.create({
        slot_id: slotId,
        chapter: slot?.chapter || '',
        label: slot?.label || '',
        order_index: slot?.order_index || 0,
        image_url: unassignedItem.url,
        placed_at: new Date().toISOString(),
      });
    }
    setUnassigned(prev => prev.filter(u => u.id !== unassignedItem.id));
    setSelectedUnassigned(null);
    queryClient.invalidateQueries({ queryKey: ['illustrations'] });
  }, [illustrationMap, queryClient]);

  const handleRemove = useCallback(async (slotId) => {
    const existing = illustrationMap[slotId];
    if (existing) {
      await base44.entities.Illustration.update(existing.id, { image_url: null, placed_at: null });
      queryClient.invalidateQueries({ queryKey: ['illustrations'] });
    }
  }, [illustrationMap, queryClient]);

  const handleBulkUpload = useCallback(async (files) => {
    const { matched, unmatched: unmatchedFiles } = matchImages(Array.from(files), SLOT_CONFIG);
    // Upload all in parallel
    const matchedEntries = Object.entries(matched);
    await Promise.all(matchedEntries.map(([slotId, file]) => handleUpload(slotId, file)));
    // Upload unmatched and add to tray
    const newUnassigned = await Promise.all(
      unmatchedFiles.map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return { id: `${Date.now()}-${file.name}`, name: file.name, url: file_url };
      })
    );
    if (newUnassigned.length > 0) {
      setUnassigned(prev => [...prev, ...newUnassigned]);
    }
  }, [handleUpload]);

  const handleBookmark = useCallback(() => {
    const y = window.scrollY;
    localStorage.setItem('jr_scroll', y);
    localStorage.setItem('jr_bookmark', y);
    // Detect chapter
    const chapterEls = document.querySelectorAll('[data-chapter]');
    let chapter = null;
    for (const el of chapterEls) {
      if (el.getBoundingClientRect().top < window.innerHeight / 2) chapter = el.dataset.chapter;
    }
    if (chapter) { localStorage.setItem('jr_bookmark_chapter', chapter); setBookmarkChapter(chapter); }
    setBookmark(y);
  }, []);

  const handleGoToBookmark = useCallback(() => {
    if (bookmark !== null) window.scrollTo({ top: bookmark, behavior: 'smooth' });
  }, [bookmark]);

  const handleDragEnd = useCallback((result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === 'unassigned-tray') return;
    const img = unassigned.find(u => u.id === draggableId);
    if (img) handleAssignFromTray(destination.droppableId, img);
  }, [unassigned, handleAssignFromTray]);

  const sharedProps = { illustrationMap, onUpload: handleUpload, onAssignFromTray: handleAssignFromTray, onRemove: handleRemove, selectedUnassigned, setSelectedUnassigned };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-cream font-book">
        <AppHeader
          view={view} setView={setView}
          placedCount={placedCount}
          onOpenBulkUpload={() => setShowBulkModal(true)}
          onBookmark={handleBookmark}
          onGoToBookmark={handleGoToBookmark}
          bookmark={bookmark}
          bookmarkChapter={bookmarkChapter}
          onOpenProofReader={() => setShowProofReader(true)}
        />
        <main ref={scrollRef} className="max-w-3xl mx-auto px-4 pt-24 pb-16">
          {view === 'book' && (
            <>
              <StoryArc />
              <ChapterIndex
                illustrationMap={illustrationMap}
                onJump={(chapterId) => {
                  const el = document.querySelector(`[data-chapter="${chapterId}"]`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              />
              <BookView {...sharedProps} />
            </>
          )}
          {view === 'gallery' && <GalleryView {...sharedProps} />}
          {view === 'export'  && <ExportView  illustrationMap={illustrationMap} />}
        </main>
        {showProofReader && <ProofReader onClose={() => setShowProofReader(false)} />}
        {showBulkModal && (
          <BulkUploadModal
            onUpload={(files) => handleBulkUpload(files)}
            onClose={() => setShowBulkModal(false)}
          />
        )}
        <UnassignedTray
          unassigned={unassigned}
          selectedId={selectedUnassigned}
          onSelect={setSelectedUnassigned}
          onRemoveFromTray={(id) => setUnassigned(prev => prev.filter(u => u.id !== id))}
        />
      </div>
    </DragDropContext>
  );
}