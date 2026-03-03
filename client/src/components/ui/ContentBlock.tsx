import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";

interface Props {
  children?: React.ReactNode;
}

export default function ContentBlock({ children }: Props) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.4,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0.1, scale: 1, y: 15 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0.1, scale: 1, y: 15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ willChange: inView ? 'auto' : 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
