import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, KeyRound, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeSelection } from '@/hooks/use-theme-selection';

export function ProductScreen({ children }: { children: ReactNode }) {
  const { activeTheme } = useThemeSelection();
  return <div className="adora-theme relative isolate min-h-dvh overflow-y-auto bg-background text-foreground" data-theme={activeTheme.palette}>
    <img src={activeTheme.sky} alt="" className="fixed inset-0 -z-20 h-full w-full object-cover" />
    <div className="fixed inset-0 -z-10 bg-background/85" />
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-8 sm:py-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-5">
        <Button asChild variant="ghost" className="px-0"><Link to="/"><ArrowLeft />AdoraDrive</Link></Button>
        <nav aria-label="Produto" className="flex gap-2">
          <Button asChild variant="outline"><Link to="/ativacao" activeProps={{ className: 'bg-accent text-primary' }}><KeyRound />Ativação</Link></Button>
          <Button asChild variant="outline"><Link to="/loja" activeProps={{ className: 'bg-accent text-primary' }}><ShoppingBag />Loja</Link></Button>
        </nav>
      </header>
      <main className="py-8 sm:py-12">{children}</main>
    </div>
  </div>;
}