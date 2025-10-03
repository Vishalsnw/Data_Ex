import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ExternalLink } from "lucide-react";
import type { Deal } from "@shared/schema";

interface DealCardProps {
  deal: Deal;
  viewMode: "grid" | "list";
}

function formatTimeLeft(expiresAt: Date | string | null): string {
  if (!expiresAt) return "No expiry";
  
  const now = new Date();
  const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  const diff = expiryDate.getTime() - now.getTime();
  
  if (diff <= 0) return "Expired";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d left`;
  return `${hours}h left`;
}

function formatPrice(price: number): string {
  return `₹${price.toLocaleString()}`;
}

function getPlatformBadgeClass(platform: string): string {
  return `platform-badge-${platform}`;
}

function openDealUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export default function DealCard({ deal, viewMode }: DealCardProps) {
  if (viewMode === "list") {
    return (
      <div className="deal-card bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="flex">
          <div className="relative w-48 h-32 flex-shrink-0">
            <img 
              src={deal.imageUrl || '/api/placeholder/400/320'} 
              alt={deal.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 discount-badge px-2 py-1 rounded-full text-xs">
              {deal.discountPercentage}% OFF
            </div>
            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold ${getPlatformBadgeClass(deal.platform)}`}>
              {deal.platform.charAt(0).toUpperCase() + deal.platform.slice(1)}
            </div>
          </div>
          
          <div className="flex-1 p-4 flex justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2 line-clamp-2" data-testid={`text-deal-title-${deal.id}`}>
                {deal.title}
              </h3>
              <Badge variant="secondary" className="text-xs mb-3" data-testid={`badge-category-${deal.id}`}>
                {deal.category.charAt(0).toUpperCase() + deal.category.slice(1)}
              </Badge>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span data-testid={`text-time-left-${deal.id}`}>
                  {formatTimeLeft(deal.expiresAt)}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col justify-between items-end">
              <div className="text-right">
                <div className="text-xl font-bold text-foreground" data-testid={`text-price-${deal.id}`}>
                  {formatPrice(deal.discountedPrice)}
                </div>
                <div className="text-sm text-muted-foreground line-through" data-testid={`text-original-price-${deal.id}`}>
                  {formatPrice(deal.originalPrice)}
                </div>
              </div>
              <Button 
                size="sm"
                onClick={() => openDealUrl(deal.dealUrl)}
                data-testid={`button-view-deal-${deal.id}`}
              >
                View Deal
                <ExternalLink className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="deal-card bg-card rounded-lg border border-border overflow-hidden shadow-sm" data-testid={`card-deal-${deal.id}`}>
      <div className="relative">
        <img 
          src={deal.imageUrl || '/api/placeholder/400/320'} 
          alt={deal.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 discount-badge px-3 py-1.5 rounded-full text-sm">
          <span data-testid={`text-discount-${deal.id}`}>{deal.discountPercentage}% OFF</span>
        </div>
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${getPlatformBadgeClass(deal.platform)}`}>
          <span data-testid={`text-platform-${deal.id}`}>
            {deal.platform.charAt(0).toUpperCase() + deal.platform.slice(1)}
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2" data-testid={`text-deal-title-${deal.id}`}>
          {deal.title}
        </h3>
        <div className="flex items-center space-x-2 mb-3">
          <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${deal.id}`}>
            {deal.category.charAt(0).toUpperCase() + deal.category.slice(1)}
          </Badge>
        </div>
        <div className="flex items-end space-x-2 mb-4">
          <span className="text-2xl font-bold text-foreground" data-testid={`text-price-${deal.id}`}>
            {formatPrice(deal.discountedPrice)}
          </span>
          <span className="text-sm text-muted-foreground line-through" data-testid={`text-original-price-${deal.id}`}>
            {formatPrice(deal.originalPrice)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center">
            <Clock className="mr-1 w-3 h-3" />
            <span data-testid={`text-time-left-${deal.id}`}>
              {formatTimeLeft(deal.expiresAt)}
            </span>
          </span>
          <Button 
            size="sm"
            onClick={() => openDealUrl(deal.dealUrl)}
            data-testid={`button-view-deal-${deal.id}`}
          >
            View Deal
            <ExternalLink className="ml-1.5 w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
