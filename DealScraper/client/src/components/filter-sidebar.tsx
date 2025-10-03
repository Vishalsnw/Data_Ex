import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Filter, X } from "lucide-react";
import type { DealFilters } from "@shared/schema";
import { platforms, categories } from "@shared/schema";

interface FilterSidebarProps {
  filters: DealFilters;
  onFiltersChange: (filters: Partial<DealFilters>) => void;
}

export default function FilterSidebar({ filters, onFiltersChange }: FilterSidebarProps) {
  const [minDiscount, setMinDiscount] = useState([filters.minDiscount || 0]);

  const handlePlatformChange = (platform: string, checked: boolean) => {
    const currentPlatforms = filters.platforms || [];
    const newPlatforms = checked
      ? [...currentPlatforms, platform]
      : currentPlatforms.filter(p => p !== platform);
    
    onFiltersChange({ platforms: newPlatforms });
  };

  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = filters.categories || [];
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(c => c !== category);
    
    onFiltersChange({ categories: newCategories });
  };

  const handleMinDiscountChange = (value: number[]) => {
    setMinDiscount(value);
    onFiltersChange({ minDiscount: value[0] });
  };

  const clearFilters = () => {
    setMinDiscount([0]);
    onFiltersChange({
      platforms: [],
      categories: [],
      minDiscount: 0,
      minPrice: undefined,
      maxPrice: undefined,
    });
  };

  const platformColors = {
    amazon: "text-amazon",
    flipkart: "text-flipkart",
    myntra: "text-myntra",
    meesho: "text-meesho",
  };

  return (
    <aside className="lg:w-72 flex-shrink-0">
      <div className="bg-card rounded-lg border border-border p-5 sticky top-20">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
          <Filter className="mr-2 text-primary w-5 h-5" />
          Filters
        </h2>

        {/* Platform Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Platform</h3>
          <div className="space-y-2">
            {platforms.map((platform) => (
              <div key={platform} className="flex items-center space-x-3">
                <Checkbox
                  id={`platform-${platform}`}
                  checked={(filters.platforms || []).includes(platform)}
                  onCheckedChange={(checked) => 
                    handlePlatformChange(platform, checked as boolean)
                  }
                  data-testid={`checkbox-platform-${platform}`}
                />
                <Label 
                  htmlFor={`platform-${platform}`}
                  className={`text-sm cursor-pointer flex items-center ${
                    platformColors[platform as keyof typeof platformColors]
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mr-2 bg-${platform}`} />
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border my-5"></div>

        {/* Category Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Category</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-3">
                <Checkbox
                  id={`category-${category}`}
                  checked={(filters.categories || []).includes(category)}
                  onCheckedChange={(checked) => 
                    handleCategoryChange(category, checked as boolean)
                  }
                  data-testid={`checkbox-category-${category}`}
                />
                <Label 
                  htmlFor={`category-${category}`}
                  className="text-sm cursor-pointer"
                >
                  {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' & ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border my-5"></div>

        {/* Minimum Discount */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Min. Discount</h3>
            <span 
              className="text-sm font-bold text-primary"
              data-testid="text-min-discount"
            >
              {minDiscount[0]}%
            </span>
          </div>
          <Slider
            value={minDiscount}
            onValueChange={handleMinDiscountChange}
            max={100}
            step={5}
            className="mb-2"
            data-testid="slider-min-discount"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="border-t border-border my-5"></div>

        {/* Price Range */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Price Range</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Min Price</Label>
              <Input
                type="number"
                placeholder="₹0"
                value={filters.minPrice || ''}
                onChange={(e) => onFiltersChange({ 
                  minPrice: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                data-testid="input-min-price"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Max Price</Label>
              <Input
                type="number"
                placeholder="₹10000"
                value={filters.maxPrice || ''}
                onChange={(e) => onFiltersChange({ 
                  maxPrice: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                data-testid="input-max-price"
              />
            </div>
          </div>
        </div>

        <Button 
          variant="outline"
          onClick={clearFilters}
          className="w-full"
          data-testid="button-clear-filters"
        >
          <X className="mr-2 w-4 h-4" />
          Clear Filters
        </Button>
      </div>
    </aside>
  );
}
