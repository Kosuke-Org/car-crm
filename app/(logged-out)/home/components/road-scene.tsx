'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { CarIllustration } from './car-illustration';

const drive = { duration: 2.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] } as const;

export function RoadScene() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div aria-hidden className="mt-12 overflow-x-clip sm:mt-16">
      <div className="px-4 sm:px-6">
        <div className="container mx-auto flex max-w-6xl justify-end lg:pr-16">
          <motion.div
            className="-mb-1 w-52 sm:w-72"
            initial={shouldReduceMotion ? false : { x: '-100vw' }}
            animate={{ x: 0 }}
            transition={drive}
          >
            <CarIllustration wheelTransition={shouldReduceMotion ? undefined : drive} />
          </motion.div>
        </div>
      </div>

      <div className="bg-foreground py-4 sm:py-5">
        <div className="h-1 bg-[repeating-linear-gradient(90deg,var(--color-brand-accent)_0_40px,transparent_40px_76px)]" />
      </div>
    </div>
  );
}
