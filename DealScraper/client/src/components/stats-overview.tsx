import { ShoppingBag, Percent, Flame, Store } from "lucide-react";

interface StatsProps {
  stats?: {
    totalDeals: number;
    avgDiscount: number;
    bestDiscount: number;
    platforms: number;
  };
}

export default function StatsOverview({ stats }: StatsProps) {
  if (!stats) return null;

  const statItems = [
    {
      label: "Total Deals",
      value: stats.totalDeals.toLocaleString(),
      icon: ShoppingBag,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Avg Discount",
      value: `${stats.avgDiscount}%`,
      icon: Percent,
      color: "text-amazon",
      bgColor: "bg-amazon/10",
    },
    {
      label: "Best Deal",
      value: `${stats.bestDiscount}%`,
      icon: Flame,
      color: "text-myntra",
      bgColor: "bg-myntra/10",
    },
    {
      label: "Platforms",
      value: stats.platforms.toString(),
      icon: Store,
      color: "text-flipkart",
      bgColor: "bg-flipkart/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <div key={index} className="stats-card rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                {item.label}
              </p>
              <p 
                className="text-2xl font-bold text-foreground mt-1" 
                data-testid={`stat-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                {item.value}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full ${item.bgColor} flex items-center justify-center`}>
              <item.icon className={`${item.color} w-6 h-6`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
