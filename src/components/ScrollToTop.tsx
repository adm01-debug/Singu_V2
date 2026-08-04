import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    // Determine if navigating "up" (detail → list) — use instant scroll
    // Or navigating "across" (list → list) — use smooth scroll
    const isGoingUp = prev.split('/').length > pathname.split('/').length;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: isGoingUp ? 'instant' : 'smooth',
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;
