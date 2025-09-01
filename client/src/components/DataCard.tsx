import { LucideIcon } from "lucide-react";

interface DataCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function DataCard({ title, value, icon: Icon, subtitle, trend, className, onClick }: DataCardProps) {
  const CardContent = () => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="text-2xl sm:text-3xl font-bold text-primary mt-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center text-sm mt-2">
            <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
              {trend.value}
            </span>
            <span className="text-muted-foreground ml-2">geçen aya göre</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-primary/10 rounded-full">
        <Icon className="h-6 w-6 text-primary" />
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        className={`bg-card rounded-lg border border-border p-4 sm:p-6 text-left hover:bg-accent transition-colors w-full ${className || ''}`}
      >
        <CardContent />
      </button>
    );
  }

  return (
    <div className={`bg-card rounded-lg border border-border p-4 sm:p-6 ${className || ''}`}>
      <CardContent />
    </div>
  );
}
