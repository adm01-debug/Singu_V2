import { useEffect, useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);
  locationRef.current = location;
  const pushedRef = useRef(false);
  const closingRef = useRef(false);
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
      closingRef.current = true;
      handleClose();
    }
  }, [handleClose]);

  useEffect(() => {
    if (isOpen && !pushedRef.current && !closingRef.current) {
      const route = locationRef.current;
      pushedRef.current = true;
      navigate({ pathname: route.pathname, search: route.search, hash: route.hash }, {
        state: route.state,
      });
      const routerState: unknown = window.history.state;
      window.history.replaceState({ ...(routerState && typeof routerState === 'object' ? routerState : {}), modal: id }, '');
      setIsClosing(false);
    }

    if (!isOpen) {
      closingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsClosing(false);
      if (pushedRef.current) {
        pushedRef.current = false;
        const routerState: unknown = window.history.state;
        if (routerState && typeof routerState === 'object' && 'modal' in routerState
          && routerState.modal === id) navigate(-1);
      }
    }
  }, [isOpen, id, navigate]);

  useEffect(() => {
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handlePopState]);

  return { isClosing };
}
