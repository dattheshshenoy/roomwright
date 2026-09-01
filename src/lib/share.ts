import { coerce, snapshot, type ImportedLayout } from "../state/persistence";

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad)));
}

/** A URL that encodes the whole layout — room, openings, placements, custom
 *  pieces. No backend; the link is the data. */
export function shareLink(): string {
  const param = b64urlEncode(JSON.stringify(snapshot()));
  return `${location.origin}${location.pathname}?layout=${param}`;
}

export function layoutFromUrl(): ImportedLayout | null {
  const param = new URLSearchParams(location.search).get("layout");
  if (!param) return null;
  try {
    return coerce(JSON.parse(b64urlDecode(param)));
  } catch {
    return null;
  }
}
