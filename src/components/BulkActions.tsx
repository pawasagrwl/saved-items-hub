import { useApp } from '@/context/AppContext';
import { useBulkSelect } from '@/context/BulkSelectContext';
import { Trash2, Tag, Download, X, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToJSON, exportToCSV } from '@/lib/exportData';
import { useState } from 'react';

export default function BulkActions() {
  const { selectedIds, clearSelection, isActive, toggleActive } = useBulkSelect();
  const { allItems, unsaveItem, userTags, tagItem } = useApp();
  const [showTagMenu, setShowTagMenu] = useState(false);

  const count = selectedIds.size;

  if (!isActive) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs gap-1.5"
        onClick={toggleActive}
      >
        <CheckSquare className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Select</span>
      </Button>
    );
  }

  const selectedItems = allItems.filter(i => selectedIds.has(i.id));

  const handleBulkUnsave = () => {
    selectedIds.forEach(id => unsaveItem(id));
    clearSelection();
  };

  const handleBulkTag = (tag: string) => {
    selectedIds.forEach(id => tagItem(id, tag));
    setShowTagMenu(false);
  };

  const handleExportSelected = (format: 'json' | 'csv') => {
    if (format === 'json') {
      exportToJSON(selectedItems, userTags.assignments);
    } else {
      exportToCSV(selectedItems, userTags.assignments);
    }
  };

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <span className="text-xs font-mono text-primary">{count} selected</span>

      {count > 0 && (
        <>
          <div className="relative">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setShowTagMenu(!showTagMenu)}>
              <Tag className="h-3 w-3" /> Tag
            </Button>
            {showTagMenu && userTags.tags.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-popover border border-border rounded shadow-lg z-50 animate-fade-in">
                {userTags.tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleBulkTag(tag)}
                    className="block w-full text-left px-3 py-1.5 text-xs hover:bg-secondary text-foreground whitespace-nowrap"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleExportSelected('json')}>
            <Download className="h-3 w-3" /> Export
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={handleBulkUnsave}>
            <Trash2 className="h-3 w-3" /> Unsave
          </Button>
        </>
      )}

      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={() => { clearSelection(); toggleActive(); }}>
        <X className="h-3 w-3" /> Cancel
      </Button>
    </div>
  );
}