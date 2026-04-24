import { useState, useRef, useCallback } from "react";

export function useUndoDelete(onDelete: (id: string) => void) {
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const requestDelete = useCallback(
    (id: string) => {
      const next = new Set(pendingIds);
      next.add(id);
      setPendingIds(next);

      const timeout = setTimeout(() => {
        onDelete(id);
        setPendingIds((prev) => {
          const updated = new Set(prev);
          updated.delete(id);
          return updated;
        });
        pendingRef.current.delete(id);
      }, 5000);

      pendingRef.current.set(id, timeout);
    },
    [onDelete, pendingIds]
  );

  const undoDelete = useCallback((id: string) => {
    const timeout = pendingRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      pendingRef.current.delete(id);
    }
    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return { pendingIds, requestDelete, undoDelete };
}
