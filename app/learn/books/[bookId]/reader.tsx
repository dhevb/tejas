"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { Button } from "@/components/ui/button";

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.5;

type LoadedBook = {
  pdf: PDFDocumentProxy;
  annotationMode: number;
};

export function BookReader({ bookId, title }: { bookId: string; title: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [book, setBook] = useState<LoadedBook | null>(null);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1);
  const [page, setPage] = useState(1);
  const pageCount = book?.pdf.numPages ?? 0;

  useEffect(() => {
    let cancelled = false;
    let loading: { destroy: () => Promise<void> } | null = null;
    let pdf: PDFDocumentProxy | null = null;
    setBook(null);
    setError("");
    setPage(1);
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
        const response = await fetch(`/api/learn/books/${encodeURIComponent(bookId)}/file`, {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/pdf" },
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || "The e-book could not be opened.");
        }
        const data = new Uint8Array(await response.arrayBuffer());
        if (cancelled) return;
        const task = pdfjs.getDocument({
          data,
          isEvalSupported: false,
          disableRange: true,
          disableStream: true,
          enableXfa: false,
          wasmUrl: "/pdfjs/wasm/",
          standardFontDataUrl: "/pdfjs/standard_fonts/",
        });
        loading = task;
        const opened = await task.promise;
        if (cancelled) {
          await opened.destroy();
          return;
        }
        pdf = opened;
        setBook({ pdf: opened, annotationMode: pdfjs.AnnotationMode.DISABLE });
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "The e-book could not be opened.");
      }
    })();
    return () => {
      cancelled = true;
      if (pdf) void pdf.destroy();
      else void loading?.destroy();
    };
  }, [bookId]);

  const fitWidth = useCallback(async (opened: PDFDocumentProxy) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const first = await opened.getPage(1);
    const viewport = first.getViewport({ scale: 1 });
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (scroller.clientWidth - 24) / viewport.width));
    first.cleanup();
    setScale(next);
  }, []);

  useEffect(() => {
    if (!book) return;
    void fitWidth(book.pdf);
  }, [book, fitWidth]);

  function goTo(next: number) {
    const target = Math.min(pageCount, Math.max(1, next));
    setPage(target);
    const scroller = scrollerRef.current;
    const node = scroller?.querySelector<HTMLElement>(`[data-ebook-page="${target}"]`);
    if (!scroller || !node) return;
    const top = node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTo({ top, behavior: "smooth" });
  }

  function showPage(next: number) {
    setPage((current) => (current === next ? current : next));
  }

  return (
    <div data-testid="ebook-reader" className="overflow-hidden rounded-2xl border border-tejas-border bg-stone-100">
      <style>{`
        @media print {
          .tejas-ebook-toolbar, .tejas-ebook-pages { display: none !important; }
          .tejas-ebook-paper-note { display: block !important; }
        }
      `}</style>
      <p className="tejas-ebook-paper-note hidden px-4 py-6 text-sm text-tejas-ink">This e-book stays in the TEJAS reader.</p>
      <div className="tejas-ebook-toolbar flex flex-wrap items-center gap-2 border-b border-tejas-border bg-white px-3 py-2">
        <Button type="button" variant="outline" size="sm" className="h-11 px-3" onClick={() => goTo(page - 1)} disabled={!book || page <= 1} data-testid="ebook-previous">Previous</Button>
        <p className="min-w-28 text-center text-sm font-semibold text-tejas-ink" data-testid="ebook-page-label" aria-live="polite">
          {book ? `Page ${page} of ${pageCount}` : "Opening"}
        </p>
        <Button type="button" variant="outline" size="sm" className="h-11 px-3" onClick={() => goTo(page + 1)} disabled={!book || page >= pageCount} data-testid="ebook-next">Next</Button>
        <Button type="button" variant="outline" size="sm" className="h-11 px-3" onClick={() => setScale((value) => Math.max(MIN_SCALE, Number((value - 0.2).toFixed(2))))} disabled={!book} data-testid="ebook-zoom-out">Zoom out</Button>
        <p className="min-w-14 text-center text-sm text-tejas-ink" data-testid="ebook-zoom-label">{Math.round(scale * 100)}%</p>
        <Button type="button" variant="outline" size="sm" className="h-11 px-3" onClick={() => setScale((value) => Math.min(MAX_SCALE, Number((value + 0.2).toFixed(2))))} disabled={!book} data-testid="ebook-zoom-in">Zoom in</Button>
        <Button type="button" variant="ghost" size="sm" className="h-11 px-3" onClick={() => book && void fitWidth(book.pdf)} disabled={!book}>Fit width</Button>
      </div>
      {error ? <p className="px-4 py-6 text-sm text-tejas-error" role="alert">{error}</p> : null}
      {!book && !error ? <p className="px-4 py-6 text-sm text-tejas-muted">Opening {title}…</p> : null}
      <div
        ref={scrollerRef}
        className="tejas-ebook-pages h-[70vh] overflow-auto overscroll-contain px-3 py-4 sm:h-[78vh]"
        onContextMenu={(event) => event.preventDefault()}
      >
        {book ? (
          <div className="mx-auto w-max space-y-4">
            {Array.from({ length: pageCount }, (_, index) => (
              <BookPage
                key={index + 1}
                book={book}
                pageNumber={index + 1}
                scale={scale}
                title={title}
                onVisible={showPage}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function BookPage({
  book,
  pageNumber,
  scale,
  title,
  onVisible,
}: {
  book: LoadedBook;
  pageNumber: number;
  scale: number;
  title: string;
  onVisible: (pageNumber: number) => void;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [seen, setSeen] = useState(pageNumber <= 2);
  const visibleRef = useRef(onVisible);
  visibleRef.current = onVisible;

  useEffect(() => {
    const node = holderRef.current;
    const root = node?.parentElement?.parentElement ?? null;
    if (!node || !root) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setSeen(true);
        if (entry.intersectionRatio >= 0.6) visibleRef.current(pageNumber);
      }
    }, { root, threshold: [0, 0.6] });
    observer.observe(node);
    return () => observer.disconnect();
  }, [pageNumber]);

  useEffect(() => {
    if (!seen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    (async () => {
      const pdfPage = await book.pdf.getPage(pageNumber);
      if (cancelled) {
        pdfPage.cleanup();
        return;
      }
      const viewport = pdfPage.getViewport({ scale });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      const renderTask = pdfPage.render({
        canvas,
        viewport,
        intent: "display",
        annotationMode: book.annotationMode,
      });
      task = renderTask;
      try {
        await renderTask.promise;
      } catch (error) {
        if (error instanceof Error && error.name === "RenderingCancelledException") return;
      } finally {
        pdfPage.cleanup();
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [book, pageNumber, scale, seen]);

  return (
    <div ref={holderRef} data-ebook-page={pageNumber} data-testid="ebook-page" className="flex min-h-24 min-w-max justify-center">
      <canvas ref={canvasRef} aria-label={`${title}, page ${pageNumber}`} className="select-none bg-white shadow-sm" />
    </div>
  );
}
