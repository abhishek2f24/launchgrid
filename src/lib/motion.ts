export const SPRING_GENTLE: any = { type: 'spring', stiffness: 120, damping: 20 };
export const SPRING_SNAPPY: any = { type: 'spring', stiffness: 300, damping: 28 };
export const SPRING_BOUNCY: any = { type: 'spring', stiffness: 400, damping: 24 };
export const EASE_EDITORIAL: any = [0.16, 1, 0.3, 1];
export const EASE_CINEMATIC: any  = [0.22, 1, 0.36, 1];

export const fadeUp: any = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0,  transition: { ...SPRING_GENTLE } }
};
export const fadeIn: any = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: EASE_EDITORIAL } }
};
export const staggerContainer = (stagger = 0.1): any => ({
  hidden:  {},
  visible: { transition: { staggerChildren: stagger } }
});
