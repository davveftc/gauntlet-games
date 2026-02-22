"use client";
import Card from "@/components/shared/Card";

interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
}

interface StatsGridProps {
  stats: StatItem[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center p-4">
          {stat.icon && <span className="text-2xl mb-1 block">{stat.icon}</span>}
          <p className="font-display text-2xl font-bold text-accent">{stat.value}</p>
          <p className="text-muted text-xs mt-1">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}
