import { useApp } from '@/context/AppContext';
import { ViewTab } from '@/types/reddit';
import { LayoutGrid, FileText, MessageSquare } from 'lucide-react';

/**
 * Sticky segmented tab strip shown on mobile, right under the Header.
 * Provides clear visual division between All / Posts / Comments.
 */
export default function MobileTabBar() {
  const { filters, updateFilter, filteredItems, postCount, commentCount } = useApp();

  const tabs: { value: ViewTab; label: string; count: number; Icon: typeof LayoutGrid }[] = [
    { value: 'all', label: 'All', count: filteredItems.length, Icon: LayoutGrid },
    { value: 'posts', label: 'Posts', count: postCount, Icon: FileText },
    { value: 'comments', label: 'Comments', count: commentCount, Icon: MessageSquare },
  ];

  return (
    <nav
      className="md:hidden sticky top-24 z-40 bg-background/95 backdrop-blur-xl border-b border-border"
    >
      <div className="flex p-1 gap-1">
        {tabs.map(({ value, label, count, Icon }) => {
          const active = filters.tab === value;
          return (
            <button
              key={value}
              onClick={() => updateFilter('tab', value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-all ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/50 text-muted-foreground active:bg-secondary'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              <span className={`font-mono text-[10px] ${active ? 'opacity-80' : 'opacity-60'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
