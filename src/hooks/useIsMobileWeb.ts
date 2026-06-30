import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 900;

function readIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export function useIsMobileWeb() {
  const [isMobile, setIsMobile] = useState(readIsMobile);

  useEffect(() => {
    const onResize = () => setIsMobile(readIsMobile());

    onResize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return isMobile;
}
