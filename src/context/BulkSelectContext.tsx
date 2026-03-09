import React, { createContext, useContext, useState, useCallback } from 'react';

interface BulkSelectContextType {
  selectedIds: Set<string>;
  isActive: boolean;
  toggleActive: () => void;
  toggleItem: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

const BulkSelectContext = createContext<BulkSelectContextType | null>(null);

export function useBulkSelect() {
  const ctx = useContext(BulkSelectContext);
  if (!ctx) throw new Error('useBulkSelect must be inside BulkSelectProvider');
  return ctx;
}

export function BulkSelectProvider({ children }: { children: React.ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(false);

  const toggleActive = useCallback(() => {
    setIsActive(prev => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return (
    <BulkSelectContext.Provider value={{ selectedIds, isActive, toggleActive, toggleItem, selectAll, clearSelection, isSelected }}>
      {children}
    </BulkSelectContext.Provider>
  );
}