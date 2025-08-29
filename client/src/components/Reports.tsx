import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart3, FileText, Clock, Calendar, TrendingUp } from "lucide-react";
import type { Invoice, Expense, Customer } from "@shared/schema";

interface ReportsProps {
  user: any;
}

export function Reports({ user }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<"expense" | "aging">("expense");

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

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Bilinmeyen Müşteri";
  };

  // Expense Report by Category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    const category = expense.label || "Kategorisiz";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(expense);
    return acc;
  }, {} as Record<string, typeof expenses>);

  const expenseReport = Object.entries(expensesByCategory).map(([category, categoryExpenses]) => {
    const total = categoryExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
    return {
      category,
      expenses: categoryExpenses,
      total,
      count: categoryExpenses.length
    };
  }).sort((a, b) => b.total - a.total);

  // Invoice Aging Report
  const today = new Date();
  const agingBuckets = {
    current: [] as Invoice[],
    days10: [] as Invoice[],
    days20: [] as Invoice[],
    over20: [] as Invoice[]
  };

  invoices.forEach(invoice => {
    const remainingAmount = parseFloat(invoice.amount.toString()) - parseFloat(invoice.paidAmount || "0");
    if (remainingAmount <= 0) return; // Skip fully paid invoices

    const invoiceDate = new Date(invoice.date);
    const daysDiff = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 10) {
      agingBuckets.current.push(invoice);
    } else if (daysDiff < 20) {
      agingBuckets.days10.push(invoice);
    } else if (daysDiff < 30) {
      agingBuckets.days20.push(invoice);
    } else {
      agingBuckets.over20.push(invoice);
    }
  });

  const calculateBucketTotal = (bucketInvoices: Invoice[]) => {
    return bucketInvoices.reduce((sum, inv) => {
      const remainingAmount = parseFloat(inv.amount.toString()) - parseFloat(inv.paidAmount || "0");
      return sum + remainingAmount;
    }, 0);
  };

  const agingReport = [
    {
      label: "10 günden az",
      invoices: agingBuckets.current,
      total: calculateBucketTotal(agingBuckets.current),
      color: "bg-green-100 text-green-800"
    },
    {
      label: "10-20 gün arası",
      invoices: agingBuckets.days10,
      total: calculateBucketTotal(agingBuckets.days10),
      color: "bg-yellow-100 text-yellow-800"
    },
    {
      label: "20-30 gün arası", 
      invoices: agingBuckets.days20,
      total: calculateBucketTotal(agingBuckets.days20),
      color: "bg-orange-100 text-orange-800"
    },
    {
      label: "30 gün üzerinde",
      invoices: agingBuckets.over20,
      total: calculateBucketTotal(agingBuckets.over20),
      color: "bg-red-100 text-red-800"
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center">
          <BarChart3 className="h-8 w-8 mr-3" />
          Raporlar
        </h1>
        <p className="text-muted-foreground">Masraf ve alacak yaşlandırma raporları</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("expense")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "expense"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              data-testid="tab-expense-report"
            >
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Masraf Raporu
            </button>
            <button
              onClick={() => setActiveTab("aging")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "aging"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              data-testid="tab-aging-report"
            >
              <Clock className="h-4 w-4 inline mr-1" />
              Alacak Yaşlandırma
            </button>
          </nav>
        </div>
      </div>

      {/* Expense Report */}
      {activeTab === "expense" && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Kategoriye Göre Masraf Raporu
            </h2>
            
            {expenseReport.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Henüz masraf kaydı yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {expenseReport.map((categoryData, index) => (
                  <div key={categoryData.category} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-lg">{categoryData.category}</h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(categoryData.total)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {categoryData.count} masraf
                        </p>
                      </div>
                    </div>
                    
                    {/* Expense Details */}
                    <div className="space-y-2">
                      {categoryData.expenses.map((expense) => (
                        <div key={expense.id} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
                          <div>
                            <p className="font-medium">{expense.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(expense.date)}
                            </p>
                          </div>
                          <p className="font-semibold text-primary">
                            {formatCurrency(parseFloat(expense.amount.toString()))}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Total Summary */}
                <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Toplam Masraf</h3>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Aging Report */}
      {activeTab === "aging" && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Alacak Yaşlandırma Raporu
            </h2>
            
            {agingReport.every(bucket => bucket.invoices.length === 0) ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Alacak yok</p>
              </div>
            ) : (
              <div className="space-y-4">
                {agingReport.map((bucket, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${bucket.color} mr-3`}>
                          {bucket.label}
                        </span>
                        <span className="text-muted-foreground">
                          ({bucket.invoices.length} fatura)
                        </span>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {formatCurrency(bucket.total)}
                      </p>
                    </div>
                    
                    {bucket.invoices.length > 0 && (
                      <div className="space-y-2">
                        {bucket.invoices.map((invoice) => {
                          const remainingAmount = parseFloat(invoice.amount.toString()) - parseFloat(invoice.paidAmount || "0");
                          const daysDiff = Math.floor((today.getTime() - new Date(invoice.date).getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div key={invoice.id} className="flex justify-between items-center py-2 px-3 bg-muted/30 rounded">
                              <div>
                                <p className="font-medium">{invoice.invoiceNumber || `#${invoice.id.slice(-8)}`}</p>
                                <p className="text-sm text-muted-foreground">
                                  {getCustomerName(invoice.customerId)} • {formatDate(invoice.date)} • {daysDiff} gün
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-primary">
                                  {formatCurrency(remainingAmount)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Toplam: {formatCurrency(parseFloat(invoice.amount.toString()))}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Aging Summary */}
                <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Toplam Alacak Tutarı</h3>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(agingReport.reduce((sum, bucket) => sum + bucket.total, 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}