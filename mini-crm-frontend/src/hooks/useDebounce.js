import { useState, useEffect } from "react";

/**
 * useDebounce
 * ───────────
 * Delays updating the returned value until `delay` ms have passed
 * since the last change.  Used on search inputs so we don't fire
 * an API call on every single keystroke.
 *
 * Usage:
 *   const debouncedSearch = useDebounce(searchInput, 400);
 *   useEffect(() => { fetchLeads(debouncedSearch); }, [debouncedSearch]);
 */
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    // Cleanup: cancel the previous timer if value changes before delay expires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
