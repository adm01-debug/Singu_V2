import { useEffect } from 'react';

/**
 * Registry público de atalhos contextuais por escopo (Rodada I — item 2).
 * Permite que páginas registrem atalhos locais sem editar o hook global.
 *
 * Uso:
 *   useScopedShortcut({ scope: 'pipeline', keys: 'j', description: 'Próximo card', handler: () => ... });
 *
 * Cheatsheet pode listar via getRegisteredShortcuts(scope?).
 */

export interface ScopedShortcut {
  id: string;
  scope: string;
  keys: string;
  description: string;
  handler: (e: KeyboardEvent) => void;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

const registry = new Map<string, ScopedShortcut>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function registerShortcut(shortcut: ScopedShortcut): () => void {
  registry.set(shortcut.id, shortcut);
  notify();
  return () => {
    registry.delete(shortcut.id);
    notify();
  };
}

export function getRegisteredShortcuts(scope?: string): ScopedShortcut[] {
  const all = Array.from(registry.values());
  return scope ? all.filter((s) => s.scope === scope) : all;
}

export function subscribeShortcuts(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener) as unknown as void;
}

/** Hook utilitário para registrar atalho escopado dentro de uma página. */
export function useScopedShortcut(opts: Omit<ScopedShortcut, 'id'> & { id?: string }) {
  useEffect(() => {
    // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
    const id = opts.id ?? `${opts.scope}:${opts.keys}:${Math.random().toString(36).slice(2, 9)}`;
    const unregister = registerShortcut({ ...opts, id });

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
        return;
      }
      const keyMatch = e.key.toLowerCase() === opts.keys.toLowerCase();
      const ctrlMatch = opts.ctrl ? e.ctrlKey || e.metaKey : !(e.ctrlKey || e.metaKey);
      const shiftMatch = opts.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = opts.alt ? e.altKey : !e.altKey;
      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        opts.handler(e);
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      unregister();
    };
  }, [opts]);
}
