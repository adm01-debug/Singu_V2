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
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    // Start closing animation phase
    setIsClosing(true);
    // Allow animation to complete before actually closing
    const timer = setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200); // Match exit animation duration
    return () => clearTimeout(timer);
  }, [onClose]);

  const handlePopState = useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false;
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (isOpen && !pushedRef.current) {
      // Push a state entry so browser back closes the modal
      window.history.pushState({ modal: id }, '');
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
      if (pushedRef.current) {
        pushedRef.current = false;
      }
    };
  }, [handlePopState]);

  return { isClosing };
}
