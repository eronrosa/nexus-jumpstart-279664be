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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="min-h-screen"
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
