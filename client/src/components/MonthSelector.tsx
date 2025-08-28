import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  month: number;
  year: number;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
}

const months = [
  { value: 1, label: "Ocak" },
  { value: 2, label: "Şubat" },
  { value: 3, label: "Mart" },
  { value: 4, label: "Nisan" },
  { value: 5, label: "Mayıs" },
  { value: 6, label: "Haziran" },
  { value: 7, label: "Temmuz" },
  { value: 8, label: "Ağustos" },
  { value: 9, label: "Eylül" },
  { value: 10, label: "Ekim" },
  { value: 11, label: "Kasım" },
  { value: 12, label: "Aralık" },
];

export function MonthSelector({ month, year, onChangeMonth, onChangeYear }: MonthSelectorProps) {
  const currentMonth = months.find(m => m.value === month);
  
  const goToPreviousMonth = () => {
    if (month === 1) {
      onChangeMonth(12);
      onChangeYear(year - 1);
    } else {
      onChangeMonth(month - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (month === 12) {
      onChangeMonth(1);
      onChangeYear(year + 1);
    } else {
      onChangeMonth(month + 1);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
      <div className="flex items-center space-x-3">
        <select
          value={month}
          onChange={(e) => onChangeMonth(Number(e.target.value))}
          className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
          data-testid="month-selector"
        >
          {months.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label} {year}
            </option>
          ))}
        </select>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPreviousMonth}
            className="p-2 border border-input rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors touch-target"
            aria-label="Önceki ay"
            data-testid="previous-month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 border border-input rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors touch-target"
            aria-label="Sonraki ay"
            data-testid="next-month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground">
        Son güncelleme: {new Date().toLocaleTimeString("tr-TR")}
      </div>
    </div>
  );
}
