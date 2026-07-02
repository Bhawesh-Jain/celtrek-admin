"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function ZoomableImage({
  src,
  alt,
  className = "",
  thumbnailSize = "aspect-square",
}: {
  src: string;
  alt?: string;
  className?: string;
  thumbnailSize?: string;
}) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => Math.min(Math.max(prev + e.deltaY * -0.001, 1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setLastPos({ x: e.clientX, y: e.clientY });
    setTranslate((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  return (
    <>
      {/* Thumbnail */}
      <div
        className={`relative ${thumbnailSize} overflow-hidden rounded-lg border bg-muted group cursor-pointer ${className}`}
        onClick={() => setOpen(true)}
      >
        <Image
          src={src}
          alt={alt || "Image"}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Dialog with zoomable image */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetView(); }}>
        <DialogContent className="max-w-5xl p-0 bg-white/90 flex items-center justify-center">
          <div
            className="relative w-full h-[80vh] overflow-hidden cursor-grab active:cursor-grabbing"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onDoubleClick={resetView}
          >
            <Image
              src={src}
              alt={alt || "Zoomed image"}
              fill
              className="object-contain select-none"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transition: dragging ? "none" : "transform 0.2s ease-out",
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
