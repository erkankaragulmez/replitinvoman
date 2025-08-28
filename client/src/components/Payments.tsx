import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Modal } from "./Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2, CreditCard, Calendar } from "lucide-react";
import type { Payment, Invoice } from "@shared/schema";

interface PaymentsProps {
  invoice: Invoice;
}

export function Payments({ invoice }: PaymentsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["/api/payments", invoice.id],
    queryFn: async () => {
      const res = await fetch(`/api/payments/${invoice.id}`);
      if (!res.ok) throw new Error("Ödemeler alınamadı");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/payments", { 
        ...data, 
        invoiceId: invoice.id,
        amount: data.amount.toString()
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", invoice.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Başarılı", description: "Ödeme eklendi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Ödeme eklenemedi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/payments/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", invoice.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Başarılı", description: "Ödeme silindi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Ödeme silinemedi" });
    },
  });

  const resetForm = () => {
    setFormData({
      amount: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.paymentDate) {
      toast({ variant: "destructive", title: "Hata", description: "Tutar ve tarih zorunludur" });
      return;
    }

    const amount = parseFloat(formData.amount);
    const remainingAmount = parseFloat(invoice.amount) - parseFloat(invoice.paidAmount || "0");
    
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Hata", description: "Ödeme tutarı sıfırdan büyük olmalıdır" });
      return;
    }

    if (amount > remainingAmount) {
      toast({ variant: "destructive", title: "Hata", description: "Ödeme tutarı kalan tutardan fazla olamaz" });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bu ödemeyi silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  const totalPaid = parseFloat(invoice.paidAmount || "0");
  const remainingAmount = parseFloat(invoice.amount) - totalPaid;
  const progressPercentage = (totalPaid / parseFloat(invoice.amount)) * 100;

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <CreditCard className="h-5 w-5 mr-2" />
          Ödeme Durumu
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Toplam Tutar</p>
            <p className="text-lg font-bold">{formatCurrency(parseFloat(invoice.amount))}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ödenen</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kalan</p>
            <p className="text-lg font-bold text-orange-600">{formatCurrency(remainingAmount)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          %{progressPercentage.toFixed(1)} tamamlandı
        </p>
      </div>

      {/* Add Payment Button */}
      {remainingAmount > 0 && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Ödemeler</h3>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors flex items-center"
            data-testid="button-add-payment"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ödeme Ekle
          </button>
        </div>
      )}

      {/* Payments List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/30 rounded animate-pulse"></div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Henüz ödeme yok</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment: Payment) => (
            <div key={payment.id} className="bg-muted/20 rounded-lg border border-border p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(parseFloat(payment.amount))}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(payment.paymentDate)}
                      </p>
                    </div>
                  </div>
                  {payment.notes && (
                    <p className="text-sm text-muted-foreground">{payment.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(payment.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-accent rounded-md transition-colors"
                  title="Ödemeyi Sil"
                  data-testid={`button-delete-payment-${payment.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Ödeme Ekle"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ödeme Tutarı (Maks: {formatCurrency(remainingAmount)})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingAmount}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
              data-testid="input-payment-amount"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ödeme Tarihi
            </label>
            <input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
              required
              data-testid="input-payment-date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Not (İsteğe bağlı)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground resize-none"
              rows={3}
              data-testid="input-payment-notes"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-border rounded-md text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
              data-testid="button-cancel-payment"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:opacity-50"
              data-testid="button-save-payment"
            >
              {createMutation.isPending ? "Ekleniyor..." : "Ödeme Ekle"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}