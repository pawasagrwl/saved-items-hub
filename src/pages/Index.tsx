import { AppProvider, useApp } from '@/context/AppContext';
import { BulkSelectProvider, useBulkSelect } from '@/context/BulkSelectContext';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import ItemCard from '@/components/ItemCard';
import InsightsPanel from '@/components/InsightsPanel';
import BulkActions from '@/components/BulkActions';
import CollectionsPanel from '@/components/CollectionsPanel';
import { useCollections } from '@/components/CollectionsPanel';
import { Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ThemeProvider } from 'next-themes';

function Dashboard() {
  const { filteredItems, isLoading, allItems } = useApp();
  const { isActive: bulkActive } = useBulkSelect();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const { collections } = useCollections();

  const displayItems = useMemo(() => {
    if (!selectedCollectionId) return filteredItems;
    const col = collections.find(c => c.id === selectedCollectionId);
    if (!col) return filteredItems;
    const idSet = new Set(col.itemIds);
    return filteredItems.filter(item => idSet.has(item.id));
  }, [filteredItems, selectedCollectionId, collections]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading saved items…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <FilterBar />

      {bulkActive && (
        <div className="border-b border-border bg-card/50 px-4 py-2">
          <BulkActions />
        </div>
      )}

      <div className="flex-1 flex gap-4 p-2 sm:p-4 max-w-[1600px] mx-auto w-full">
        {allItems.length > 0 && (
          <div className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-16 space-y-3">
              <CollectionsPanel
                selectedCollectionId={selectedCollectionId}
                onSelectCollection={setSelectedCollectionId}
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {!bulkActive && (
            <div className="flex items-center justify-end mb-2 lg:hidden">
              <BulkActions />
            </div>
          )}
          {displayItems.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No items match your filters.
            </div>
          ) : (
            <div className="space-y-2">
              {displayItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {allItems.length > 0 && (
          <div className="hidden xl:block w-64 shrink-0">
            <div className="sticky top-16">
              <InsightsPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const Index = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
    <AppProvider>
      <BulkSelectProvider>
        <Dashboard />
      </BulkSelectProvider>
    </AppProvider>
  </ThemeProvider>
);

export default Index;
