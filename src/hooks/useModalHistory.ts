import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Hook that integrates modals with browser history.
 * When a modal opens, it pushes a state to history.
 * When browser back is pressed, the modal closes with proper animation.
 * 
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback to close the modal
 * @param id - Unique identifier for this modal in history state
 * @returns { isClosing } - Whether the modal is in its closing animation phase
 */
export function useModalHistory(
  isOpen: boolean,
  onClose: () => void,
  id: string = 'modal'
) {
  const pushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    // Start closing animation phase
    setIsClosing(true);
    // Allow animation to complete before actually closing
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsClosing(false);
      onCloseRef.current();
    }, 200); // Match exit animation duration
  }, []);

  const handlePopState = useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false;
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      // Push a state entry so browser back closes the modal
      const routerState: unknown = window.history.state;
      window.history.pushState({
        ...(routerState && typeof routerState === 'object' ? routerState : {}),
        modal: id,
      }, '');
      pushedRef.current = true;
      setIsClosing(false);
    }

    if (!isOpen && pushedRef.current) {
      // Modal closed programmatically — clean up history entry
      pushedRef.current = false;
      window.history.back();
    }
  }, [isOpen, id]);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handlePopState]);

  return { isClosing };
}
