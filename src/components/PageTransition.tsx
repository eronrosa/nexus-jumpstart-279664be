import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

// Routes that get the native-app horizontal slide. Others use a subtle fade.
const SLIDE_ROUTES = ["/zuumob", "/zuufood", "/zuupass"];

const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();
  const isSlide = SLIDE_ROUTES.some(r => pathname.startsWith(r));

  if (isSlide) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 24, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.7 }}
        className="min-h-screen will-change-transform"
        style={{ transformOrigin: "center" }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="min-h-screen"
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
