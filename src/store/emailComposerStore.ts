import { create } from 'zustand';

interface EmailComposerState {
  isOpen: boolean;
  prefilledContactId: string | null;
  open: (contactId?: string | null) => void;
  close: () => void;
}

export const useEmailComposerStore = create<EmailComposerState>((set) => ({
  isOpen: false,
  prefilledContactId: null,
  open: (contactId = null) => set({ isOpen: true, prefilledContactId: contactId }),
  close: () => set({ isOpen: false, prefilledContactId: null }),
}));
