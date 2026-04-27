import { useState, useRef, useCallback } from "react";

export interface PendingDelete {
  id: string;
  label: string;
}

export function useUndoDelete(onDelete: (id: string) => void) {
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [lastDeleted, setLastDeleted] = useState<PendingDelete | null>(null);

  const requestDelete = useCallback(
    (id: string, label = "") => {
      const next = new Set(pendingIds);
      next.add(id);
      setPendingIds(next);
      setLastDeleted({ id, label });

      const timeout = setTimeout(() => {
        onDelete(id);
        setPendingIds((prev) => {
          const updated = new Set(prev);
          updated.delete(id);
          return updated;
        });
        pendingRef.current.delete(id);
        setLastDeleted((prev) => (prev?.id === id ? null : prev));
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
    setLastDeleted(null);
  }, []);

  const dismissToast = useCallback(() => {
    setLastDeleted(null);
  }, []);

  return { pendingIds, requestDelete, undoDelete, lastDeleted, dismissToast };
}
