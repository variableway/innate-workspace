import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Variant } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

// ─── GSAP ScrollTrigger Helpers ────────────────────────────

interface FadeInUpOptions {
  y?: number;
  duration?: number;
  ease?: string;
  start?: string;
  once?: boolean;
}

export function fadeInUp(
  element: HTMLElement | string,
  options: FadeInUpOptions = {}
): gsap.core.Tween {
  const {
    y = 30,
    duration = 0.7,
    ease = 'power3.out',
    start = 'top 80%',
    once = true,
  } = options;

  const tween = gsap.from(element, {
    opacity: 0,
    y,
    duration,
    ease,
    scrollTrigger: {
      trigger: element as HTMLElement,
      start,
      once,
    },
  });

  return tween;
}

interface StaggerChildrenOptions {
  childSelector?: string;
  y?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  start?: string;
  once?: boolean;
}

export function staggerChildren(
  container: HTMLElement | string,
  options: StaggerChildrenOptions = {}
): gsap.core.Tween {
  const {
    childSelector = '> *',
    y = 30,
    duration = 0.7,
    stagger = 0.08,
    ease = 'power3.out',
    start = 'top 80%',
    once = true,
  } = options;

  const tween = gsap.from(`${container} ${childSelector}`, {
    opacity: 0,
    y,
    duration,
    stagger,
    ease,
    scrollTrigger: {
      trigger: container as HTMLElement,
      start,
      once,
    },
  });

  return tween;
}

interface CountUpOptions {
  duration?: number;
  ease?: string;
  start?: string;
  once?: boolean;
  suffix?: string;
  prefix?: string;
}

export function countUp(
  element: HTMLElement,
  target: number,
  options: CountUpOptions = {}
): gsap.core.Tween {
  const {
    duration = 2,
    ease = 'power2.out',
    start = 'top 80%',
    once = true,
    suffix = '',
    prefix = '',
  } = options;

  const obj = { value: 0 };

  const tween = gsap.to(obj, {
    value: target,
    duration,
    ease,
    scrollTrigger: {
      trigger: element,
      start,
      once,
    },
    onUpdate: () => {
      const val = Math.round(obj.value);
      element.textContent = `${prefix}${val.toLocaleString()}${suffix}`;
    },
  });

  return tween;
}

// ─── Framer Motion Variants ────────────────────────────────

export const fadeInUpVariant: Record<string, Variant> = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};

export const staggerContainer: Record<string, Variant> = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Record<string, Variant> = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
};
