import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Modal } from "./Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Edit2, Trash2, CreditCard, Eye } from "lucide-react";
import type { Expense } from "@shared/schema";

interface ExpensesProps {
  user: any;
}

export function Expenses({ user }: ExpensesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  // Load saved form data on component mount
  useEffect(() => {
    const savedExpenseData = localStorage.getItem('expenseFormData');
    if (savedExpenseData) {
      try {
        const parsedData = JSON.parse(savedExpenseData);
        setFormData(prev => ({
          ...prev,
          ...parsedData
        }));
      } catch (error) {
        console.error('Error loading saved expense data:', error);
      }
    }
  }, []);

  // Save form data to localStorage
  const saveFormData = (data: typeof formData) => {
    localStorage.setItem('expenseFormData', JSON.stringify(data));
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["/api/expenses", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?userId=${user.id}`);
      if (!res.ok) throw new Error("Masraflar alınamadı");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/expenses", { 
        ...data, 
        userId: user.id,
        amount: data.amount.toString()
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", user.id] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Başarılı", description: "Masraf eklendi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Masraf eklenemedi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/expenses/${id}`, {
        ...data,
        amount: data.amount.toString()
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", user.id] });
      setIsModalOpen(false);
      setEditingExpense(null);
      resetForm();
      toast({ title: "Başarılı", description: "Masraf güncellendi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Masraf güncellenemedi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/expenses/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", user.id] });
      toast({ title: "Başarılı", description: "Masraf silindi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Masraf silinemedi" });
    },
  });

  const resetForm = () => {
    const emptyForm = {
      label: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
    };
    setFormData(emptyForm);
    localStorage.removeItem('expenseFormData');
  };

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    if (!editingExpense) {
      // Only save to localStorage if not editing (for new expenses)
      saveFormData(updatedData);
    }
  };

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        label: expense.label,
        amount: expense.amount.toString(),
        date: expense.date,
      });
    } else {
      setEditingExpense(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const openViewModal = (expense: Expense) => {
    setViewingExpense(expense);
    setIsViewModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.amount.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Açıklama ve tutar gereklidir" });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Hata", description: "Geçerli bir tutar girin" });
      return;
    }

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bu masrafı silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <section className="p-4 sm:p-6 lg:p-8">
        <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 sm:p-6 lg:p-8">
      <div className="bg-card rounded-lg border border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-0 flex items-center">
            <CreditCard className="h-6 w-6 mr-2" />
            Masraflar
          </h2>
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors touch-target flex items-center justify-center"
            data-testid="button-new-expense"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Masraf
          </button>
        </div>

        {/* Mobile Expense Cards (visible on mobile) */}
        <div className="block lg:hidden space-y-4">
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz masraf yok</p>
            </div>
          ) : (
            expenses.map((expense: Expense) => (
              <div key={expense.id} className="bg-muted/30 rounded-lg border border-border p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground" data-testid={`expense-label-${expense.id}`}>
                      {expense.label}
                    </h4>
                    <p className="text-muted-foreground text-sm mt-1">
                      {formatDate(expense.date)}
                    </p>
                  </div>
                  <p className="font-bold text-primary text-lg">
                    {formatCurrency(parseFloat(expense.amount.toString()))}
                  </p>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    onClick={() => openViewModal(expense)}
                    className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-accent rounded-md transition-colors touch-target"
                    title="Görüntüle"
                    data-testid={`button-view-expense-${expense.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => openModal(expense)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors touch-target"
                    title="Düzenle"
                    data-testid={`button-edit-expense-${expense.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-accent rounded-md transition-colors touch-target"
                    title="Sil"
                    data-testid={`button-delete-expense-${expense.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (hidden on mobile) */}
        <div className="hidden lg:block">
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz masraf yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      Açıklama
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      Tarih
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                      Tutar
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {expenses.map((expense: Expense) => (
                    <tr key={expense.id} className="hover:bg-muted/30">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {expense.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                        {formatCurrency(parseFloat(expense.amount.toString()))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openViewModal(expense)}
                            className="text-muted-foreground hover:text-blue-600 transition-colors"
                            title="Görüntüle"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openModal(expense)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingExpense ? "Masraf Düzenle" : "Yeni Masraf"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Masraf Açıklaması <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleInputChange('label', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                placeholder="Masraf açıklaması girin"
                required
                data-testid="input-expense-label"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Tutar <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                placeholder="0.00"
                required
                data-testid="input-expense-amount"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Tarih <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                required
                data-testid="input-expense-date"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 border border-input rounded-md text-foreground hover:bg-accent transition-colors touch-target"
                data-testid="button-cancel-expense"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-save-expense"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kaydediliyor...
                  </div>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2 inline-block" />
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Masraf Detayları"
        >
          {viewingExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Masraf Açıklaması</label>
                  <p className="text-lg font-semibold text-foreground">{viewingExpense.label}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Tutar</label>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(parseFloat(viewingExpense.amount.toString()))}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Tarih</label>
                  <p className="text-foreground">{formatDate(viewingExpense.date)}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                  data-testid="button-close-view-expense"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </section>
  );
}
