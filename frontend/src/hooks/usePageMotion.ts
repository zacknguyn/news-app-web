import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { readAppPreferences } from '../lib/appPreferences';

gsap.registerPlugin(useGSAP);

export function usePageMotion<T extends HTMLElement>() {
  const scopeRef = useRef<T>(null);

  useGSAP(() => {
    const pageTargets = gsap.utils.toArray<HTMLElement>('[data-motion="page"]');
    const listTargets = gsap.utils.toArray<HTMLElement>('[data-motion="list"]');
    const motionPreference = readAppPreferences().motion;
    const reduceMotion = motionPreference === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      if (pageTargets.length) gsap.set(pageTargets, { autoAlpha: 1, y: 0 });
      if (listTargets.length) gsap.set(listTargets, { autoAlpha: 1, y: 0 });
      return;
    }

    if (pageTargets.length) {
      gsap.from(pageTargets, {
        y: 14,
        autoAlpha: 0,
        duration: 0.38,
        ease: 'power3.out',
        stagger: 0.05,
      });
    }

    if (listTargets.length) {
      gsap.from(listTargets, {
        y: 10,
        autoAlpha: 0,
        duration: 0.28,
        ease: 'power3.out',
        stagger: 0.035,
        delay: 0.06,
      });
    }
  }, { scope: scopeRef });

  return scopeRef;
}
