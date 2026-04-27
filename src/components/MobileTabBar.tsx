import { useApp } from '@/context/AppContext';
import { ViewTab } from '@/types/reddit';
import { LayoutGrid, FileText, MessageSquare } from 'lucide-react';

export default function MobileTabBar() {
  const { filters, updateFilter, filteredItems, postCount, commentCount } = useApp();

  const tabs: { value: ViewTab; label: string; count: number; Icon: typeof LayoutGrid }[] = [
    { value: 'all', label: 'All', count: filteredItems.length, Icon: LayoutGrid },
    { value: 'posts', label: 'Posts', count: postCount, Icon: FileText },
    { value: 'comments', label: 'Comments', count: commentCount, Icon: MessageSquare },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex">
        {tabs.map(({ value, label, count, Icon }) => {
          const active = filters.tab === value;
          return (
            <button
              key={value}
              onClick={() => updateFilter('tab', value)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground active:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'fill-primary/10' : ''}`} />
              <span className="text-[10px] font-medium">
                {label} <span className="font-mono text-[9px] opacity-70">{count}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
