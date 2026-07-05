import { useLayoutEffect, useRef, useState } from "react";
import { pageDimensionsPx, type PrintSettings } from "../lib/printLayout";

interface Props {
  settings: PrintSettings;
  children: React.ReactNode;
}

export function PrintPages({ settings, children }: Props) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [totalHeight, setTotalHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [headerCloneHtml, setHeaderCloneHtml] = useState<string | null>(null);
  const [mainGridBottom, setMainGridBottom] = useState(Infinity);
  const [zoom, setZoom] = useState(100);
  const dims = pageDimensionsPx(settings);

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const h = measureRef.current.scrollHeight;
    setTotalHeight((prev) => (prev === h ? prev : h));

    if (settings.repeatHeader) {
      const table = measureRef.current.querySelector(".summary-grid");
      const headEl = table?.querySelector("thead") as HTMLElement | null;
      const headRow = headEl?.querySelector("tr");
      if (table && headEl && headRow) {
        const containerRect = measureRef.current.getBoundingClientRect();
        const tableRect = table.getBoundingClientRect();
        setMainGridBottom(tableRect.bottom - containerRect.top);

        const widths = Array.from(headRow.children).map((cell) => (cell as HTMLElement).offsetWidth);
        const clone = headEl.cloneNode(true) as HTMLElement;
        const cloneRow = clone.querySelector("tr");
        cloneRow?.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
        clone.removeAttribute("id");
        if (cloneRow) {
          Array.from(cloneRow.children).forEach((cell, idx) => {
            (cell as HTMLElement).style.width = `${widths[idx] ?? 0}px`;
          });
        }
        setHeaderHeight(headEl.offsetHeight);
        setHeaderCloneHtml(
          `<table class="summary-grid" style="table-layout:fixed;width:${dims.contentWidthPx}px;">${clone.outerHTML}</table>`
        );
      }
    } else {
      setHeaderHeight(0);
      setHeaderCloneHtml(null);
      setMainGridBottom(Infinity);
    }
  });

  const page1Capacity = dims.contentHeightPx;
  const laterCapacity = settings.repeatHeader ? Math.max(50, dims.contentHeightPx - headerHeight) : dims.contentHeightPx;
  const remaining = Math.max(0, totalHeight - page1Capacity);
  const numPages = totalHeight <= page1Capacity ? 1 : 1 + Math.ceil(remaining / laterCapacity);

  function shiftForPage(i: number): number {
    return i === 0 ? 0 : page1Capacity + (i - 1) * laterCapacity;
  }

  function fitToWidth() {
    const available = (typeof window !== "undefined" ? window.innerWidth : dims.pageWidthPx) - 64;
    setZoom(Math.max(25, Math.min(200, Math.floor((available / dims.pageWidthPx) * 100))));
  }

  return (
    <div className="print-pages">
      <div className="print-pages__toolbar">
        <p className="print-pages__hint">
          {numPages} page{numPages > 1 ? "s" : ""} at this page size — approximate; printed table headers repeat on
          every page automatically.
        </p>
        <div className="print-pages__zoom">
          <button onClick={() => setZoom((z) => Math.max(25, z - 10))}>−</button>
          <span>{zoom}%</span>
          <button onClick={() => setZoom((z) => Math.min(200, z + 10))}>+</button>
          <button onClick={fitToWidth}>Fit to width</button>
        </div>
      </div>
      <div className="print-pages__pages" style={{ zoom: zoom / 100 }}>
        {Array.from({ length: numPages }).map((_, i) => {
          const showHeaderOverlay = i > 0 && settings.repeatHeader && headerCloneHtml && shiftForPage(i) < mainGridBottom;
          return (
            <div className="print-page" key={i} style={{ width: dims.pageWidthPx, height: dims.pageHeightPx }}>
              <div
                className="print-page__viewport"
                style={{
                  width: dims.contentWidthPx,
                  height: dims.contentHeightPx,
                  marginTop: dims.marginTopPx,
                  marginRight: dims.marginRightPx,
                  marginBottom: dims.marginBottomPx,
                  marginLeft: dims.marginLeftPx,
                }}
              >
                {showHeaderOverlay && (
                  <div
                    className="print-page__header-overlay"
                    style={{ height: headerHeight }}
                    dangerouslySetInnerHTML={{ __html: headerCloneHtml! }}
                  />
                )}
                <div
                  className="print-page__content"
                  style={{
                    width: dims.contentWidthPx,
                    top: showHeaderOverlay ? headerHeight : 0,
                    transform: `translateY(-${shiftForPage(i)}px)`,
                  }}
                  ref={i === 0 ? measureRef : undefined}
                >
                  {children}
                </div>
              </div>
              <div className="print-page__label">
                Page {i + 1} of {numPages}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
