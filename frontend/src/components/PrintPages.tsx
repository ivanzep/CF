import { useLayoutEffect, useRef, useState } from "react";
import { pageDimensionsPx, type PrintSettings } from "../lib/printLayout";

interface Props {
  settings: PrintSettings;
  children: React.ReactNode;
}

export function PrintPages({ settings, children }: Props) {
  const measureRef = useRef<HTMLDivElement>(null);
  const [totalHeight, setTotalHeight] = useState(0);
  const dims = pageDimensionsPx(settings);

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const h = measureRef.current.scrollHeight;
    setTotalHeight((prev) => (prev === h ? prev : h));
  });

  const numPages = Math.max(1, Math.ceil(totalHeight / dims.contentHeightPx));

  return (
    <div className="print-pages">
      <p className="print-pages__hint">
        {numPages} page{numPages > 1 ? "s" : ""} at this page size — approximate; printed table headers repeat on
        every page automatically.
      </p>
      {Array.from({ length: numPages }).map((_, i) => (
        <div className="print-page" key={i} style={{ width: dims.pageWidthPx, height: dims.pageHeightPx }}>
          <div
            className="print-page__viewport"
            style={{ width: dims.contentWidthPx, height: dims.contentHeightPx, margin: dims.marginPx }}
          >
            <div
              className="print-page__content"
              style={{ width: dims.contentWidthPx, transform: `translateY(-${i * dims.contentHeightPx}px)` }}
              ref={i === 0 ? measureRef : undefined}
            >
              {children}
            </div>
          </div>
          <div className="print-page__label">
            Page {i + 1} of {numPages}
          </div>
        </div>
      ))}
    </div>
  );
}
