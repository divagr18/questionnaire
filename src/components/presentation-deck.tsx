"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Expand, Minimize, Radio, X } from "lucide-react";
import Link from "next/link";
import { type PointerEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Pack } from "@/lib/types";

export function PresentationDeck({ pack: initialPack }: { pack: Pack }) {
  const [pack, setPack] = useState(initialPack); const [slide, setSlide] = useState(0); const [direction, setDirection] = useState(1); const [fullscreen, setFullscreen] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const total = Math.max(pack.queue.length, 1);
  const move = useCallback((next: number) => { const bounded = Math.max(0, Math.min(total - 1, next)); setDirection(bounded >= slide ? 1 : -1); setSlide(bounded); }, [slide, total]);

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== "touch" || event.target instanceof Element && event.target.closest("button, a")) return;
    touchStart.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    if (!touchStart.current || event.pointerType !== "touch") return;
    const deltaX = event.clientX - touchStart.current.x;
    const deltaY = event.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    setShowSwipeHint(false);
    move(slide + (deltaX < 0 ? 1 : -1));
  }

  useEffect(() => {
    const sync = async () => {
      try {
        const response = await fetch(`/api/live/${initialPack.slug}`, { cache: "no-store" }); if (!response.ok) return;
        const next = await response.json() as Pack;
        setPack((current) => {
          const currentItem = current.queue[slide] ?? null;
          if (currentItem) {
            const nextIndex = next.queue.findIndex((item) => item.id === currentItem.id);
            setSlide(nextIndex >= 0 ? nextIndex : Math.min(slide, Math.max(next.queue.length - 1, 0)));
          } else setSlide((value) => Math.min(value, Math.max(next.queue.length - 1, 0)));
          return next;
        });
      } catch { /* Keep the last known queue if local Wi-Fi briefly drops. */ }
    };
    const interval = window.setInterval(() => void sync(), 800); return () => window.clearInterval(interval);
  }, [initialPack.slug, slide]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (["ArrowRight", " ", "PageDown"].includes(event.key)) { event.preventDefault(); move(slide + 1); } if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); move(slide - 1); } if (event.key === "Home") move(0); if (event.key === "End") move(total - 1); };
    const fs = () => setFullscreen(Boolean(document.fullscreenElement)); window.addEventListener("keydown", key); document.addEventListener("fullscreenchange", fs); return () => { window.removeEventListener("keydown", key); document.removeEventListener("fullscreenchange", fs); };
  }, [move, slide, total]);

  const item = pack.queue[slide] ?? null;
  return <main className={`deck accent-${pack.accent}`} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
    <header className="deck-header"><span>{pack.name}</span><span className="live-sync"><Radio size={13} /> Live</span><Link aria-label="Close presentation" href="/admin"><X size={19} /></Link></header>
    <AnimatePresence mode="wait" custom={direction}>
      {item ? <motion.section className="slide slide-question" key={item.id} custom={direction} initial={{ opacity: 0, x: direction * 70 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -70 }} transition={{ duration: .3 }}><div className="slide-index">{String(slide + 1).padStart(2, "0")} <span>/</span> {String(pack.queue.length).padStart(2, "0")}</div><div><h1>{item.question}</h1><p className="slide-description">{item.name}</p></div><p className="slide-type">Submitted question</p></motion.section> : <motion.section className="slide slide-end" key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><h1>Waiting for questions.</h1><p>Questions added to the queue will appear here.</p></motion.section>}
    </AnimatePresence>
    <footer className="deck-controls"><div className="deck-progress"><span style={{ width: `${pack.queue.length ? ((slide + 1) / total) * 100 : 0}%` }} /></div><div className="deck-control-row"><span>{pack.queue.length ? `${slide + 1} / ${pack.queue.length}` : "0 / 0"}</span><span className={`deck-swipe-hint ${showSwipeHint ? "" : "is-hidden"}`}>Swipe to navigate</span><div><button aria-label="Previous slide" disabled={slide === 0} onClick={() => { setShowSwipeHint(false); move(slide - 1); }}><ArrowLeft /></button><button aria-label="Next slide" disabled={slide >= pack.queue.length - 1} onClick={() => { setShowSwipeHint(false); move(slide + 1); }}><ArrowRight /></button><button className="deck-fullscreen" aria-label="Toggle fullscreen" onClick={() => fullscreen ? void document.exitFullscreen() : void document.documentElement.requestFullscreen()}>{fullscreen ? <Minimize /> : <Expand />}</button></div></div></footer>
  </main>;
}
