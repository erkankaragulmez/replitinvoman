import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MonthSelector } from "./MonthSelector";
import { DataCard } from "./DataCard";
import { formatCurrency } from "@/lib/utils";
import { 
  TrendingUp, 
  FileText, 
  Users, 
  Clock, 
  Calculator,
  Calendar,
  DollarSign
} from "lucide-react";
import type { Invoice, Expense, Customer } from "@shared/schema";

interface DashboardProps {
  user: any;
}

export function Dashboard({ user }: DashboardProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [profitLossMonthly, setProfitLossMonthly] = useState<number | null>(null);
  const [profitLossYearly, setProfitLossYearly] = useState<number | null>(null);

  // Fetch data
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/customers?userId=${user.id}`);
      if (!res.ok) throw new Error("Müşteriler alınamadı");
      return res.json();
    },
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices?userId=${user.id}`);
      if (!res.ok) throw new Error("Faturalar alınamadı");
      return res.json();
    },
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?userId=${user.id}`);
      if (!res.ok) throw new Error("Masraflar alınamadı");
      return res.json();
    },
  });

  // Calculate statistics
  const stats = useMemo(() => {
    // Filter data by selected month/year
    const filterByMonthYear = (items: any[], m: number, y: number) =>
      items.filter((item) => {
        const date = new Date(item.date);
        return date.getMonth() + 1 === m && date.getFullYear() === y;
      });

    const filterByYear = (items: any[], y: number) =>
      items.filter((item) => new Date(item.date).getFullYear() === y);

    // Monthly data
    const monthlyInvoices = filterByMonthYear(invoices, month, year);
    const monthlyExpenses = filterByMonthYear(expenses, month, year);

    // Yearly data
    const yearlyInvoices = filterByYear(invoices, year);
    const yearlyExpenses = filterByYear(expenses, year);

    // Calculate totals - Gelir: girilen fatura tutarları, Gelen Ödemeler: yapılan ödemeler
    const monthlyInvoiceTotal = monthlyInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0);
    const monthlyPaymentsReceived = monthlyInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || "0"), 0);
    const monthlyExpenseTotal = monthlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
    
    const yearlyInvoiceTotal = yearlyInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0);
    const yearlyPaymentsReceived = yearlyInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount || "0"), 0);
    const yearlyExpenseTotal = yearlyExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);

    // Bekleyen ödemeler: Ödenmemiş fatura tutarları (kalan bakiyeler)
    const pendingAmount = invoices.reduce((sum, inv) => {
      const total = parseFloat(inv.amount.toString());
      const paid = parseFloat(inv.paidAmount || "0");
      return sum + (total - paid);
    }, 0);

    return {
      monthlyInvoiceTotal,
      monthlyPaymentsReceived,
      monthlyExpenseTotal,
      yearlyInvoiceTotal,
      yearlyPaymentsReceived,
      yearlyExpenseTotal,
      pendingAmount,
    };
  }, [invoices, expenses, customers, month, year]);

  const handleMonthChange = (newMonth: number) => {
    if (newMonth === 12 && month === 1) {
      setYear(year - 1);
    } else if (newMonth === 1 && month === 12) {
      setYear(year + 1);
    }
    setMonth(newMonth);
  };

  const calculateMonthlyProfitLoss = () => {
    const result = stats.monthlyInvoiceTotal - stats.monthlyExpenseTotal;
    setProfitLossMonthly(result);
  };

  const calculateYearlyProfitLoss = () => {
    const result = stats.yearlyInvoiceTotal - stats.yearlyExpenseTotal;
    setProfitLossYearly(result);
  };

  return (
    <section className="p-4 sm:p-6 lg:p-8">
      {/* Month Selector */}
      <div className="mb-6">
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 flex items-center">
            <Calendar className="h-6 w-6 mr-2" />
            Dönem Seçimi
          </h2>
          <MonthSelector
            month={month}
            year={year}
            onChangeMonth={handleMonthChange}
            onChangeYear={setYear}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <DataCard
          title={`Yapılan İş (${month}/${year})`}
          value={formatCurrency(stats.monthlyInvoiceTotal)}
          icon={DollarSign}
          subtitle="Girilen fatura tutarları"
        />

        <DataCard
          title={`Gelen Ödemeler (${month}/${year})`}
          value={formatCurrency(stats.monthlyPaymentsReceived)}
          icon={TrendingUp}
          subtitle="Yapılan ödemeler toplamı"
          className="border-green-200 bg-green-50"
        />

        <DataCard
          title="Alacaklar"
          value={formatCurrency(stats.pendingAmount)}
          icon={Clock}
          subtitle="Ödenmemiş fatura tutarları"
          className="border-orange-200 bg-orange-50"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={calculateMonthlyProfitLoss}
          className="flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors touch-target"
          data-testid="calculate-monthly-profit-loss"
        >
          <Calculator className="h-4 w-4 mr-2" />
          Aylık Kar/Zarar Hesapla
        </button>
        <button
          onClick={calculateYearlyProfitLoss}
          className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors touch-target"
          data-testid="calculate-yearly-profit-loss"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Yıllık Kar/Zarar Hesapla
        </button>
      </div>

      {/* Profit/Loss Results */}
      {profitLossMonthly !== null && (
        <div className="mb-6">
          <div className={`bg-card rounded-lg border border-border p-4 sm:p-6 ${
            profitLossMonthly >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Aylık Kar/Zarar ({month}/{year})
            </h3>
            <p className={`text-2xl font-bold ${
              profitLossMonthly >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(profitLossMonthly)}
            </p>
            <div className="text-sm text-muted-foreground mt-2">
              Toplam Yapılan İş: {formatCurrency(stats.monthlyInvoiceTotal)} - Toplam Masraf: {formatCurrency(stats.monthlyExpenseTotal)}
            </div>
          </div>
        </div>
      )}

      {profitLossYearly !== null && (
        <div className="mb-6">
          <div className={`bg-card rounded-lg border border-border p-4 sm:p-6 text-center ${
            profitLossYearly >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Yıllık Kar/Zarar ({year})
            </h3>
            <p className={`text-3xl font-bold ${
              profitLossYearly >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(profitLossYearly)}
            </p>
            <div className="text-sm text-muted-foreground mt-2">
              Yıllık Toplam Yapılan İş: {formatCurrency(stats.yearlyInvoiceTotal)} - Yıllık Toplam Masraf: {formatCurrency(stats.yearlyExpenseTotal)}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
