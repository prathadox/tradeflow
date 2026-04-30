const STORAGE_KEY = "fp:preview";
const QUERY_KEY = "preview";
const QUERY_VALUE = "1";

export function isPreviewUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.localStorage.getItem(STORAGE_KEY) === "1") return true;
    const params = new URLSearchParams(window.location.search);
    if (params.get(QUERY_KEY) === QUERY_VALUE) {
      window.localStorage.setItem(STORAGE_KEY, "1");
      return true;
    }
  } catch {
    /* localStorage may be blocked */
  }
  return false;
}
