import { Button } from "@/components/ui/button";
import { RefreshCw, Tag, Clock } from "lucide-react";

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({ onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Tag className="text-primary-foreground w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground" data-testid="text-app-title">
                DealHunter
              </h1>
              <p className="text-xs text-muted-foreground">Best Discount Deals</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span data-testid="text-last-updated">Last updated: 2 min ago</span>
            </div>
            <Button 
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {isRefreshing ? 'Refreshing...' : 'Refresh Deals'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
