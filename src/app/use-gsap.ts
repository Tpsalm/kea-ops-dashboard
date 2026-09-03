"use client";

// GSAP scroll / timeline utility for the app.
// `gsap` is imported lazily inside an effect to keep the client bundle lean
// and to avoid SSR references to the window.
import { useEffect, useRef } from "react";

type GsapApi = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
};
type Cleanup = () => void;

/**
 * Returns a ref to attach to the element whose scroll-driven animation should
 * be set up. `onReady` runs once after GSAP (and ScrollTrigger) are loaded and
 * receives the GSAP API plus the scoped element.
 */
export function useGsapInView<T extends HTMLElement>(onReady: (api: GsapApi, scope: T) => Cleanup | void) {
  const ref = useRef<T>(null);
  const cbRef = useRef(onReady);

  useEffect(() => {
    cbRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    let cleanup: Cleanup | void;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      if (ref.current) {
        cleanup = cbRef.current({ gsap, ScrollTrigger }, ref.current);
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return ref;
}
