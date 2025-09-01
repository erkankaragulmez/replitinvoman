import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart3, FileText, Clock, Calendar, TrendingUp, Users, PieChart } from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { Invoice, Expense, Customer } from "@shared/schema";

interface ReportsProps {
  user: any;
}

export function Reports({ user }: ReportsProps) {
  const [activeTab, setActiveTab] = useState<"expense" | "aging" | "customers">("expense");
  const [customerReportPeriod, setCustomerReportPeriod] = useState<"monthly" | "yearly">("monthly");
  const [expenseReportPeriod, setExpenseReportPeriod] = useState<"monthly" | "yearly">("monthly");

  // Fetch data
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/customers?userId=${user.id}`);
      if (!res.ok) throw new Error("Müşteriler yüklenemedi");
      return res.json();
    },
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices?userId=${user.id}`);
      if (!res.ok) throw new Error("Faturalar yüklenemedi");
      return res.json();
    },
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?userId=${user.id}`);
      if (!res.ok) throw new Error("Masraflar yüklenemedi");
      return res.json();
    },
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "Bilinmeyen Müşteri";
  };

  // Filter expenses by period for expense report
  const getFilteredExpenses = (period: "monthly" | "yearly") => {
    const now = new Date();
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      if (period === "monthly") {
        return expenseDate.getMonth() === now.getMonth() && 
               expenseDate.getFullYear() === now.getFullYear();
      } else {
        return expenseDate.getFullYear() === now.getFullYear();
      }
    });
  };

  // Expense Report by Category
  const filteredExpenses = getFilteredExpenses(expenseReportPeriod);
  const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
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

  // Top 5 Customers Report
  const getCustomerReport = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const customerStats = customers.reduce((acc: any, customer: Customer) => {
      const customerInvoices = invoices.filter((invoice: Invoice) => {
        const invoiceDate = new Date(invoice.date);
        const invoiceMonth = invoiceDate.getMonth();
        const invoiceYear = invoiceDate.getFullYear();

        if (customerReportPeriod === "monthly") {
          return invoice.customerId === customer.id && 
                 invoiceMonth === currentMonth && 
                 invoiceYear === currentYear;
        } else {
          return invoice.customerId === customer.id && 
                 invoiceYear === currentYear;
        }
      });

      if (customerInvoices.length > 0) {
        const totalAmount = customerInvoices.reduce((sum: number, invoice: Invoice) => 
          sum + parseFloat(invoice.amount.toString()), 0);
        
        acc[customer.id] = {
          name: customer.name,
          invoiceCount: customerInvoices.length,
          totalAmount: totalAmount
        };
      }
      
      return acc;
    }, {});

    const sortedCustomers = Object.values(customerStats)
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    return sortedCustomers;
  };

  const customerReport = getCustomerReport();
  
  // Pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];



  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center">
          <BarChart3 className="h-8 w-8 mr-3" />
          Raporlar
        </h1>
        <p className="text-muted-foreground">Masraf, geciken alacaklar ve müşteri raporları</p>
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
              Geciken Alacaklar
            </button>
            <button
              onClick={() => setActiveTab("customers")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "customers"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              data-testid="tab-customers-report"
            >
              <Users className="h-4 w-4 inline mr-1" />
              Top 5 Müşteri
            </button>
          </nav>
        </div>
      </div>

      {/* Expense Report */}
      {activeTab === "expense" && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-semibold flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Kategoriye Göre Masraf Raporu
              </h2>
              <div className="flex bg-muted rounded-lg p-1">
                <button
                  onClick={() => setExpenseReportPeriod("monthly")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    expenseReportPeriod === "monthly" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Aylık
                </button>
                <button
                  onClick={() => setExpenseReportPeriod("yearly")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    expenseReportPeriod === "yearly" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yıllık
                </button>
              </div>
            </div>
            
            <div className="mb-4 text-sm text-muted-foreground">
              {expenseReportPeriod === "monthly" 
                ? `Bu ay (${new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}) masraf raporu`
                : `Bu yıl (${new Date().getFullYear()}) masraf raporu`
              }
            </div>

            {expenseReport.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {expenseReportPeriod === "monthly" ? "Bu ay" : "Bu yıl"} henüz masraf kaydı yok
                </p>
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
                      {formatCurrency(filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0))}
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
              Geciken Alacaklar Raporu
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

      {/* Top 5 Customers Report */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h2 className="text-xl font-semibold mb-2 sm:mb-0 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Top 5 Müşteri Raporu
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCustomerReportPeriod("monthly")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    customerReportPeriod === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  data-testid="button-monthly-report"
                >
                  Aylık
                </button>
                <button
                  onClick={() => setCustomerReportPeriod("yearly")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    customerReportPeriod === "yearly"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  data-testid="button-yearly-report"
                >
                  Yıllık
                </button>
              </div>
            </div>
            
            {customerReport.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {customerReportPeriod === "monthly" ? "Bu ay" : "Bu yıl"} fatura bulunamadı
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={customerReport}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalAmount"
                        nameKey="name"
                      >
                        {customerReport.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), "Toplam Tutar"]}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>

                {/* Customer List */}
                <div className="space-y-3">
                  {customerReport.map((customer: any, index: number) => (
                    <div 
                      key={customer.name} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.invoiceCount} fatura
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {formatCurrency(customer.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          #{index + 1}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}