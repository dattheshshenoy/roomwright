/** Hand the viewer a file. Plain-site download — not sandboxed. */
export function downloadFile(name: string, data: string | Blob, mime = "application/json") {
  const blob = typeof data === "string" ? new Blob([data], { type: mime }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The most recently rendered WebGL frame, as a PNG blob. Requires the canvas to
 *  keep its drawing buffer (set on the R3F <Canvas> gl props). */
export async function canvasPNG(): Promise<Blob | null> {
  const canvas = document.querySelector("canvas");
  if (!canvas) return null;
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}
