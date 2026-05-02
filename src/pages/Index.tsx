import { AppProvider, useApp } from '@/context/AppContext';
import { BulkSelectProvider, useBulkSelect } from '@/context/BulkSelectContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FilterBar from '@/components/FilterBar';
import ItemCard from '@/components/ItemCard';
import InsightsPanel from '@/components/InsightsPanel';
import BulkActions from '@/components/BulkActions';
import MobileTabBar from '@/components/MobileTabBar';
import { Loader2, ArrowUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Button } from '@/components/ui/button';

function Dashboard() {
  const { filteredItems, isLoading, allItems } = useApp();
  const { isActive: bulkActive } = useBulkSelect();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const displayItems = filteredItems;

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

      {/* Mobile segmented tabs — clear division between All / Posts / Comments */}
      <MobileTabBar />

      {/* Desktop-only filter bar */}
      <div className="hidden md:block">
        <FilterBar />
      </div>

      {bulkActive && (
        <div className="border-b border-border bg-card/50 px-4 py-2 hidden md:block">
          <BulkActions />
        </div>
      )}

      <div className="flex-1 flex gap-4 p-2 sm:p-4 max-w-[1600px] mx-auto w-full">
        <div className="flex-1 min-w-0">
          {displayItems.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm px-4 text-center">
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

      {showScrollTop && (
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          size="sm"
          className="md:hidden fixed bottom-14 right-4 h-10 w-10 p-0 rounded-full shadow-lg z-40"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}

      <Footer />
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
