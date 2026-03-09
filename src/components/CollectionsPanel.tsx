import { useState, useCallback } from 'react';
import { Folder, FolderPlus, ChevronRight, ChevronDown, X, Edit2, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Collection {
  id: string;
  name: string;
  parentId: string | null;
  itemIds: string[];
}

const COLLECTIONS_KEY = 'reddit_saved_viewer_collections';

function loadCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveCollections(collections: Collection[]): void {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>(loadCollections);

  const update = useCallback((fn: (prev: Collection[]) => Collection[]) => {
    setCollections(prev => {
      const next = fn(prev);
      saveCollections(next);
      return next;
    });
  }, []);

  const addCollection = useCallback((name: string, parentId: string | null = null) => {
    update(prev => [...prev, { id: crypto.randomUUID(), name, parentId, itemIds: [] }]);
  }, [update]);

  const deleteCollection = useCallback((id: string) => {
    update(prev => {
      // Remove collection and all children recursively
      const toRemove = new Set<string>();
      const findChildren = (parentId: string) => {
        toRemove.add(parentId);
        prev.filter(c => c.parentId === parentId).forEach(c => findChildren(c.id));
      };
      findChildren(id);
      return prev.filter(c => !toRemove.has(c.id));
    });
  }, [update]);

  const renameCollection = useCallback((id: string, name: string) => {
    update(prev => prev.map(c => c.id === id ? { ...c, name } : c));
  }, [update]);

  const addItemToCollection = useCallback((collectionId: string, itemId: string) => {
    update(prev => prev.map(c =>
      c.id === collectionId && !c.itemIds.includes(itemId)
        ? { ...c, itemIds: [...c.itemIds, itemId] }
        : c
    ));
  }, [update]);

  const removeItemFromCollection = useCallback((collectionId: string, itemId: string) => {
    update(prev => prev.map(c =>
      c.id === collectionId
        ? { ...c, itemIds: c.itemIds.filter(id => id !== itemId) }
        : c
    ));
  }, [update]);

  const getItemCollections = useCallback((itemId: string) => {
    return collections.filter(c => c.itemIds.includes(itemId));
  }, [collections]);

  return { collections, addCollection, deleteCollection, renameCollection, addItemToCollection, removeItemFromCollection, getItemCollections };
}

function CollectionNode({
  collection,
  collections,
  onSelect,
  onDelete,
  onRename,
  onAddChild,
  selectedId,
  depth = 0,
}: {
  collection: Collection;
  collections: Collection[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onAddChild: (parentId: string) => void;
  selectedId: string | null;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const children = collections.filter(c => c.parentId === collection.id);

  return (
    <div>
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors group ${
          selectedId === collection.id ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(collection.id)}
      >
        {children.length > 0 ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="p-0.5">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <Folder className="h-3.5 w-3.5 shrink-0 text-primary/60" />
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); onRename(collection.id, editName); setEditing(false); }} className="flex-1 flex items-center gap-1">
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="flex-1 h-5 bg-secondary border border-border rounded text-xs px-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
              onClick={e => e.stopPropagation()}
            />
            <button type="submit" className="text-success"><Check className="h-3 w-3" /></button>
          </form>
        ) : (
          <>
            <span className="flex-1 truncate">{collection.name}</span>
            <span className="text-[10px] font-mono text-muted-foreground">{collection.itemIds.length}</span>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 ml-1">
              <button onClick={(e) => { e.stopPropagation(); setEditing(true); setEditName(collection.name); }} className="p-0.5 hover:text-primary">
                <Edit2 className="h-2.5 w-2.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onAddChild(collection.id); }} className="p-0.5 hover:text-primary">
                <FolderPlus className="h-2.5 w-2.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(collection.id); }} className="p-0.5 hover:text-destructive">
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          </>
        )}
      </div>
      {expanded && children.map(child => (
        <CollectionNode
          key={child.id}
          collection={child}
          collections={collections}
          onSelect={onSelect}
          onDelete={onDelete}
          onRename={onRename}
          onAddChild={onAddChild}
          selectedId={selectedId}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

export default function CollectionsPanel({
  selectedCollectionId,
  onSelectCollection,
}: {
  selectedCollectionId: string | null;
  onSelectCollection: (id: string | null) => void;
}) {
  const { collections, addCollection, deleteCollection, renameCollection } = useCollections();
  const [newName, setNewName] = useState('');

  const rootCollections = collections.filter(c => c.parentId === null);

  const handleAddChild = (parentId: string) => {
    const name = prompt('Collection name:');
    if (name?.trim()) addCollection(name.trim(), parentId);
  };

  return (
    <div className="border border-border rounded-md bg-card">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Collections</h2>
        </div>
      </div>

      <div className="p-2">
        {/* All items option */}
        <button
          onClick={() => onSelectCollection(null)}
          className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
            selectedCollectionId === null ? 'bg-primary/15 text-primary' : 'text-foreground hover:bg-secondary'
          }`}
        >
          <Folder className="h-3.5 w-3.5" />
          All Items
        </button>

        {rootCollections.map(col => (
          <CollectionNode
            key={col.id}
            collection={col}
            collections={collections}
            onSelect={onSelectCollection}
            onDelete={deleteCollection}
            onRename={renameCollection}
            onAddChild={handleAddChild}
            selectedId={selectedCollectionId}
          />
        ))}

        {/* Add new */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) {
              addCollection(newName.trim());
              setNewName('');
            }
          }}
          className="flex items-center gap-1 mt-2 px-1"
        >
          <input
            type="text"
            placeholder="New collection…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 h-7 bg-secondary border border-border rounded text-[10px] px-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {newName.trim() && (
            <Button type="submit" variant="ghost" size="sm" className="h-7 w-7 p-0">
              <FolderPlus className="h-3 w-3" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}