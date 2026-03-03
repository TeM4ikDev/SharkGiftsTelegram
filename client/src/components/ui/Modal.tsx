import { Dialog, DialogTitle } from '@headlessui/react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { memo, ReactNode, useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  title: string | ReactNode;
  buttonFC?: () => void;
  content?: string;
  buttonCloseText?: string;
  buttonColor?: 'red' | 'blue';
  children?: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (arg: boolean) => void;
}

const closeAnimationTime = 0.2;

/** Throttle: не чаще одного раза в 150ms */
function useThrottledResize(callback: () => void, delay: number) {
  const lastRun = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const run = () => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback();
      }
    };

    const onResize = () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(run);
    };

    run();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [callback, delay]);
}

export const Modal = memo(function Modal({
  title,
  buttonCloseText = "Закрыть",
  buttonColor = "blue",
  children,
  buttonFC,
  isOpen,
  setIsOpen
}: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);
  const prevIsOpenRef = useRef(isOpen);

  const checkMobile = useCallback(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useThrottledResize(checkMobile, 150);

  useEffect(() => {
    const prevIsOpen = prevIsOpenRef.current;

    if (isOpen && !prevIsOpen) {
      prevIsOpenRef.current = isOpen;
      setIsAnimating(true);
      setShouldClose(false);
    } else if (!isOpen && prevIsOpen) {
      setShouldClose(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        setShouldClose(false);
        prevIsOpenRef.current = isOpen;
        buttonFC?.();
      }, closeAnimationTime * 1000);
      return () => clearTimeout(timer);
    } else {
      prevIsOpenRef.current = isOpen;
    }
  }, [isOpen, buttonFC]);

  const handleClose = useCallback(() => {
    setShouldClose(true);
    setTimeout(() => {
      setIsAnimating(false);
      setShouldClose(false);
      buttonFC?.();
      setIsOpen(false);
    }, closeAnimationTime * 1000);
  }, [setIsOpen, buttonFC]);

  const dialogOpen = isOpen || isAnimating;
  const slideY = isMobile ? 500 : 0;

  return (
    <Dialog open={dialogOpen} onClose={handleClose} className="flex relative z-50"

    >
      <AnimatePresence  >
        {isAnimating && (
          <>
            {/* Затемненный фон — без blur (backdrop-blur сильно грузит) */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: shouldClose ? 0 : 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: closeAnimationTime, ease: "easeOut" }}
              className="fixed inset-0 bg-black/70"
              style={{ willChange: 'opacity' }}
              aria-hidden="true"
            />

            <div className="fixed inset-0 flex items-end md:items-center px-2 justify-center pointer-events-none"
            >
              <Dialog.Panel className="w-full max-w-md pointer-events-auto">
                <motion.div
                  key="modal-content"
                  initial={{ y: slideY }}
                  animate={{ y: shouldClose ? slideY : 0 }}
                  exit={{ y: slideY }}
                  transition={{ duration: closeAnimationTime, ease: "easeOut" }}
                  className="bg-app-dark pb-2 rounded-t-3xl md:rounded-xl border-2 shadow-2xl flex flex-col max-h-[90vh] md:max-h-none"
                  style={{ willChange: 'transform' }}
                >
                  <div className="flex items-center justify-between p-3 border-b border-gray-700">
                    <DialogTitle as="h3" className="text-xl text-center font-semibold text-gold-500">
                      {title}
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="p-2 rounded-lg bg-app-cardLight hover:bg-gray-800 transition-colors duration-200"
                      aria-label="Закрыть"
                    >
                      <X className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                    </button>
                  </div>

                  <div className="flex flex-col flex-1 min-h-[35vh] overflow-y-auto p-3"
                    style={{
                      paddingBottom: 'var(--tg-safe-area-inset-bottom)',
                    }}>
                    {children}
                  </div>
                </motion.div>
              </Dialog.Panel>
            </div>
          </>
        )}
      </AnimatePresence>
    </Dialog>
  );
});
