import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import StatsOverview from "@/components/stats-overview";
import FilterSidebar from "@/components/filter-sidebar";
import DealCard from "@/components/deal-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Grid, List, ArrowDown } from "lucide-react";
import type { Deal, DealFilters } from "@shared/schema";

const ITEMS_PER_PAGE = 12;

export default function Home() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<DealFilters>({
    sortBy: "discount_desc",
    page: 1,
    limit: ITEMS_PER_PAGE,
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ["/api/deals", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.platforms && filters.platforms.length > 0) {
        filters.platforms.forEach(p => params.append('platforms', p));
      }
      if (filters.categories && filters.categories.length > 0) {
        filters.categories.forEach(c => params.append('categories', c));
      }
      if (filters.minDiscount !== undefined) {
        params.append('minDiscount', filters.minDiscount.toString());
      }
      if (filters.minPrice !== undefined) {
        params.append('minPrice', filters.minPrice.toString());
      }
      if (filters.maxPrice !== undefined) {
        params.append('maxPrice', filters.maxPrice.toString());
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters.page !== undefined) {
        params.append('page', filters.page.toString());
      }
      if (filters.limit !== undefined) {
        params.append('limit', filters.limit.toString());
      }
      
      const url = `/api/deals?${params.toString()}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error('Failed to fetch deals');
      }
      return response.json();
    },
    enabled: true,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/deals/stats"],
    enabled: true,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/deals/refresh", { 
        method: "POST",
        credentials: "include" 
      });
      if (!response.ok) {
        throw new Error("Failed to refresh deals");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals/stats"] });
      toast({
        title: "Deals Refreshed",
        description: "Successfully fetched the latest deals from all platforms.",
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateFilters = (newFilters: Partial<DealFilters>) => {
    setFilters(prev => ({ 
      ...prev, 
      ...newFilters, 
      page: newFilters.page || 1 // Reset to first page when filters change
    }));
  };

  const loadMore = () => {
    updateFilters({ page: (filters.page || 1) + 1 });
  };

  const deals = dealsData?.deals || [];
  const totalDeals = dealsData?.total || 0;
  const hasMoreDeals = (filters.page || 1) * ITEMS_PER_PAGE < totalDeals;

  return (
    <div className="min-h-screen bg-background">
      <Header onRefresh={() => refreshMutation.mutate()} isRefreshing={refreshMutation.isPending} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <StatsOverview stats={stats} />
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <FilterSidebar filters={filters} onFiltersChange={updateFilters} />

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort & View Controls */}
            <div className="bg-card rounded-lg border border-border p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value) => updateFilters({ sortBy: value as any })}
                >
                  <SelectTrigger 
                    className="w-48" 
                    data-testid="select-sort"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount_desc">Highest Discount</SelectItem>
                    <SelectItem value="discount_asc">Lowest Discount</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="platform">Platform</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground" data-testid="text-deal-count">
                  Showing {deals.length} of {totalDeals} deals
                </span>
                <div className="flex items-center space-x-1 border border-border rounded-md p-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`p-1.5 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setViewMode("grid")}
                    data-testid="button-view-grid"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`p-1.5 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setViewMode("list")}
                    data-testid="button-view-list"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Deals Grid/List */}
            {dealsLoading ? (
              <div className={`grid gap-5 ${viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : deals.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No deals found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or refreshing the deals
                </p>
              </div>
            ) : (
              <>
                <div className={`grid gap-5 ${viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'}`}>
                  {deals.map((deal: Deal) => (
                    <DealCard key={deal.id} deal={deal} viewMode={viewMode} />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMoreDeals && (
                  <div className="mt-8 text-center">
                    <Button 
                      variant="outline" 
                      onClick={loadMore}
                      className="px-6 py-3"
                      data-testid="button-load-more"
                    >
                      <span>Load More Deals</span>
                      <ArrowDown className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
