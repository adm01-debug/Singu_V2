import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Star, StickyNote } from 'lucide-react';

const BOOKMARKS_KEY_PREFIX = 'intel-bookmarks-v1';
const NOTES_PREFIX_BASE = 'intel-notes-v1:';

function countBookmarks(userId: string): number {
  try {
    const raw = localStorage.getItem(`${BOOKMARKS_KEY_PREFIX}-${userId}`);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch { return 0; }
}

function countNotes(userId: string): number {
  const prefix = `${NOTES_PREFIX_BASE}${userId}:`;
  try {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const p = JSON.parse(raw);
            if (p && typeof p.text === 'string' && p.text.trim().length > 0) n += 1;
          } catch { /* ignore */ }
        }
      }
    }
    return n;
  } catch { return 0; }
}

function focusPinnedPanel(): void {
  const el = document.querySelector('[data-intel-aside="pinned"]') as HTMLElement | null;
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('intel-aside-flash');
    window.setTimeout(() => el.classList.remove('intel-aside-flash'), 1200);
  }
}

function openCommandPalette(): void {
  // Dispara o mesmo atalho que abre o IntelCommandPalette (Ctrl+P)
  const ev = new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true });
  window.dispatchEvent(ev);
}

/**
 * Badge da status bar com contadores de bookmarks (★) e notas (📝) ativos.
 * Click em ★ abre command palette; click em NOTE foca aside Pinned.
 */
export const IntelBookmarksNotesBadge = () => {
  const { user } = useAuth();
  const userId = user?.id ?? 'anon';
  const [bookmarks, setBookmarks] = useState(0);
  const [notes, setNotes] = useState(0);

  useEffect(() => {
    const bookmarksKey = `${BOOKMARKS_KEY_PREFIX}-${userId}`;
    const notesPrefix = `${NOTES_PREFIX_BASE}${userId}:`;
    const refresh = () => {
      setBookmarks(countBookmarks(userId));
      setNotes(countNotes(userId));
    };
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === bookmarksKey || e.key.startsWith(notesPrefix)) refresh();
    };
    window.addEventListener('storage', onStorage);
    const t = window.setInterval(refresh, 3000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(t);
    };
  }, [userId]);

  return (
    <span className="hidden sm:inline-flex items-center gap-2" aria-label="Bookmarks e notas">
      <button
        type="button"
        onClick={openCommandPalette}
        className="inline-flex items-center gap-1 hover:text-[hsl(var(--intel-accent))] focus-visible:text-[hsl(var(--intel-accent))]"
        title={`${bookmarks} bookmark${bookmarks === 1 ? '' : 's'} · clique para abrir command palette`}
        aria-label={`${bookmarks} bookmarks ativos — abrir command palette`}
      >
        <Star
          className={`h-3 w-3 ${bookmarks > 0 ? 'text-[hsl(var(--intel-accent))]' : 'text-muted-foreground opacity-50'}`}
          fill={bookmarks > 0 ? 'currentColor' : 'none'}
          aria-hidden
        />
        <span className={bookmarks > 0 ? 'text-[hsl(var(--intel-accent))]' : 'text-muted-foreground'}>
          ★{bookmarks}
        </span>
      </button>
      <button
        type="button"
        onClick={focusPinnedPanel}
        className="inline-flex items-center gap-1 hover:text-[hsl(var(--intel-accent))] focus-visible:text-[hsl(var(--intel-accent))]"
        title={`${notes} nota${notes === 1 ? '' : 's'} salva${notes === 1 ? '' : 's'} · clique para focar painel`}
        aria-label={`${notes} notas salvas — focar painel lateral`}
      >
        <StickyNote
          className={`h-3 w-3 ${notes > 0 ? 'text-[hsl(var(--intel-accent))]' : 'text-muted-foreground opacity-50'}`}
          aria-hidden
        />
        <span className={notes > 0 ? 'text-[hsl(var(--intel-accent))]' : 'text-muted-foreground'}>
          NOTE:{notes}
        </span>
      </button>
    </span>
  );
};
