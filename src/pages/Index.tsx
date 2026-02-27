import { AppProvider, useApp } from '@/context/AppContext';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import ItemCard from '@/components/ItemCard';
import InsightsPanel from '@/components/InsightsPanel';
import { Loader2 } from 'lucide-react';

function Dashboard() {
  const { filteredItems, isLoading, allItems } = useApp();

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

      <div className="flex-1 flex gap-4 p-2 sm:p-4 max-w-[1600px] mx-auto w-full">
        {/* Main feed */}
        <div className="flex-1 min-w-0">
          {filteredItems.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              No items match your filters.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {allItems.length > 0 && (
          <div className="hidden lg:block w-64 shrink-0">
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
  <AppProvider>
    <Dashboard />
  </AppProvider>
);

export default Index;
