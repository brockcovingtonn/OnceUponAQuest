import { useEffect, useState } from 'react';

import { useReducedMotion } from '@/lib/useReducedMotion';

/**
 * Cycles 0 → steps-1 every `intervalMs`, then starts over — drives the
 * walkthrough's looping examples. With Reduce Motion on, it stays on the
 * final step (a still picture of the finished example).
 */
export function useLoopStep(steps: number, intervalMs: number, active = true): number {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced || !active) return;
    const timer = setInterval(() => setStep((s) => (s + 1) % steps), intervalMs);
    return () => clearInterval(timer);
  }, [reduced, active, steps, intervalMs]);

  return reduced ? steps - 1 : step;
}
