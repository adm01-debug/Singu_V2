/**
 * Captura snapshot PNG do canvas do react-force-graph-2d
 * encontrado dentro do container fornecido.
 */
export function snapshotGraphCanvas(container: HTMLElement | null, filename: string): boolean {
  if (typeof document === 'undefined') return false;
  if (!container) return false;
  const canvas = container.querySelector('canvas');
  if (!canvas) return false;
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}
