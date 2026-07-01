import type { Variants, Transition } from "framer-motion";

const spring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 26,
};

/** Parent container that staggers its children into view. */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** A single item that fades and rises into place. Use inside `staggerContainer`. */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: spring },
};

/** Simple opacity fade with no vertical movement. */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25 } },
};
