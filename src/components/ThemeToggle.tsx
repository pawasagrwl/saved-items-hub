import { Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [switching, setSwitching] = useState(false);

  const handleClick = () => {
    if (switching) return;
    setSwitching(true);
    // Show overlay briefly while CSS variables/colors swap on the page
    requestAnimationFrame(() => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      // Allow paints + any image/icon recolor to finish
      window.setTimeout(() => setSwitching(false), 350);
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        onClick={handleClick}
        title="Toggle theme"
        disabled={switching}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {switching && (
        <div
          className="fixed inset-0 z-[200] bg-background/85 backdrop-blur-sm flex items-center justify-center animate-fade-in"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-2 text-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Applying theme…</span>
          </div>
        </div>
      )}
    </>
  );
}
