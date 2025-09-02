import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Modal } from "./Modal";
import { Payments } from "./Payments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Edit2, Trash2, FileText, Eye, CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";
import type { Invoice, Customer } from "@shared/schema";

interface InvoicesProps {
  user: any;
}

export function Invoices({ user }: InvoicesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    customerId: "",
    description: "",
    amount: "",
    paid: false,
    date: new Date().toISOString().slice(0, 10),
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["/api/customers", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/customers?userId=${user.id}`);
      if (!res.ok) throw new Error("Müşteriler yüklenemedi");
      return res.json();
    },
  });

  // Load saved form data on component mount
  useEffect(() => {
    const savedInvoiceData = localStorage.getItem('invoiceFormData');
    if (savedInvoiceData && customers.length > 0) {
      try {
        const parsedData = JSON.parse(savedInvoiceData);
        setFormData(prev => ({
          ...prev,
          customerId: customers.length > 0 ? customers[0].id : "",
          ...parsedData
        }));
      } catch (error) {
        console.error('Error loading saved invoice data:', error);
      }
    }
  }, [customers]);

  // Save form data to localStorage
  const saveFormData = (data: typeof formData) => {
    localStorage.setItem('invoiceFormData', JSON.stringify(data));
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();



  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices?userId=${user.id}`);
      if (!res.ok) throw new Error("Faturalar yüklenemedi");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/invoices", { 
        ...data, 
        userId: user.id,
        amount: data.amount.toString()
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.refetchQueries({ queryKey: ["/api/invoices", user.id] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Başarılı", description: "Fatura eklendi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Fatura eklenemedi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/invoices/${id}`, {
        ...data,
        amount: data.amount.toString()
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", user.id] });
      setIsModalOpen(false);
      setEditingInvoice(null);
      resetForm();
      toast({ title: "Başarılı", description: "Fatura güncellendi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Fatura güncellenemedi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/invoices/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices", user.id] });
      toast({ title: "Başarılı", description: "Fatura silindi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Fatura silinemedi" });
    },
  });

  const resetForm = () => {
    const emptyForm = {
      customerId: customers.length > 0 ? customers[0].id : "",
      description: "",
      amount: "",
      paid: false,
      date: new Date().toISOString().slice(0, 10),
    };
    setFormData(emptyForm);
    localStorage.removeItem('invoiceFormData');
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    if (!editingInvoice) {
      // Only save to localStorage if not editing (for new invoices)
      saveFormData(updatedData);
    }
  };

  const openModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoice(invoice);
      setFormData({
        customerId: invoice.customerId,
        description: invoice.description || "",
        amount: invoice.amount.toString(),
        paid: invoice.paid || false,
        date: invoice.date,
      });
    } else {
      setEditingInvoice(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.amount.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Müşteri ve tutar gereklidir" });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Hata", description: "Geçerli bir tutar girin" });
      return;
    }

    if (editingInvoice) {
      updateMutation.mutate({ id: editingInvoice.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bu faturayı silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c: Customer) => c.id === customerId);
    return customer ? customer.name : "Bilinmiyor";
  };

  const getStatusIcon = (paid: boolean) => {
    return paid ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (invoice: Invoice) => {
    const totalAmount = parseFloat(invoice.amount);
    const paidAmount = parseFloat(invoice.paidAmount || "0");
    
    if (paidAmount === 0) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Ödenmemiş
        </span>
      );
    } else if (paidAmount >= totalAmount) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Ödenmiş
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Kısmi Ödendi
        </span>
      );
    }
  };

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const openViewModal = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setIsViewModalOpen(true);
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
            <FileText className="h-6 w-6 mr-2" />
            Faturalar
          </h2>
          <button
            onClick={() => openModal()}
            disabled={customers.length === 0}
            className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors touch-target flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-new-invoice"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Fatura
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Önce müşteri ekleyin</p>
          </div>
        ) : (
          <>
            {/* Mobile Invoice Cards (visible on mobile) */}
            <div className="block lg:hidden space-y-4">
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Henüz fatura yok</p>
                </div>
              ) : (
                invoices.map((invoice: Invoice) => (
                  <div key={invoice.id} className="bg-muted/30 rounded-lg border border-border p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground" data-testid={`invoice-id-${invoice.id}`}>
                          {invoice.invoiceNumber || `#${invoice.id.slice(-8)}`}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {getCustomerName(invoice.customerId)}
                        </p>
                      </div>
                      {getStatusBadge(invoice)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tarih</p>
                        <p className="font-medium">{formatDate(invoice.date)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tutar</p>
                        <p className="font-bold text-primary">{formatCurrency(parseFloat(invoice.amount.toString()))}</p>
                      </div>
                    </div>
                    {invoice.description && (
                      <div className="mt-2">
                        <p className="text-muted-foreground text-sm">Açıklama</p>
                        <p className="text-sm">{invoice.description}</p>
                      </div>
                    )}
                    {/* Payment Info */}
                    {parseFloat(invoice.paidAmount || "0") > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Ödenen:</span>
                          <span className="font-semibold text-green-600">{formatCurrency(parseFloat(invoice.paidAmount || "0"))}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Kalan:</span>
                          <span className="font-semibold text-orange-600">{formatCurrency(parseFloat(invoice.amount) - parseFloat(invoice.paidAmount || "0"))}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => openViewModal(invoice)}
                        className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-accent rounded-md transition-colors touch-target"
                        title="Görüntüle"
                        data-testid={`button-view-invoice-${invoice.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {parseFloat(invoice.amount) > parseFloat(invoice.paidAmount || "0") && (
                        <button
                          onClick={() => openPaymentModal(invoice)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-md transition-colors touch-target"
                          title="Ödeme Ekle"
                          data-testid={`button-payment-invoice-${invoice.id}`}
                        >
                          <CreditCard className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => openModal(invoice)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors touch-target"
                        title="Düzenle"
                        data-testid={`button-edit-invoice-${invoice.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-accent rounded-md transition-colors touch-target"
                        title="Sil"
                        data-testid={`button-delete-invoice-${invoice.id}`}
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
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Henüz fatura yok</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Fatura No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Müşteri
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Açıklama
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Tarih
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Tutar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Kalan Bakiye
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-foreground uppercase tracking-wider">
                          Durum
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-foreground uppercase tracking-wider">
                          İşlemler
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {invoices.map((invoice: Invoice) => (
                        <tr key={invoice.id} className="hover:bg-muted/30">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {invoice.invoiceNumber || `#${invoice.id.slice(-8)}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {getCustomerName(invoice.customerId)}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                            {invoice.description || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {formatDate(invoice.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary">
                            {formatCurrency(parseFloat(invoice.amount.toString()))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-orange-600">
                            {formatCurrency(parseFloat(invoice.amount.toString()) - parseFloat(invoice.paidAmount || "0"))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(invoice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => openViewModal(invoice)}
                                className="text-muted-foreground hover:text-blue-600 transition-colors"
                                title="Görüntüle"
                                data-testid={`button-view-invoice-${invoice.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {parseFloat(invoice.amount) > parseFloat(invoice.paidAmount || "0") && (
                                <button
                                  onClick={() => openPaymentModal(invoice)}
                                  className="text-muted-foreground hover:text-primary transition-colors"
                                  title="Ödeme Ekle"
                                  data-testid={`button-payment-invoice-${invoice.id}`}
                                >
                                  <CreditCard className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openModal(invoice)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Düzenle"
                                data-testid={`button-edit-invoice-${invoice.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(invoice.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                title="Sil"
                                data-testid={`button-delete-invoice-${invoice.id}`}
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
          </>
        )}

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingInvoice ? "Fatura Düzenle" : "Yeni Fatura"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Müşteri <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                required
                data-testid="select-invoice-customer"
              >
                <option value="">Müşteri seçin</option>
                {customers.map((customer: Customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Açıklama</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                placeholder="Fatura açıklaması"
                data-testid="input-invoice-description"
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
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                placeholder="0.00"
                required
                data-testid="input-invoice-amount"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Tarih <span className="text-destructive">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                required
                data-testid="input-invoice-date"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="paid"
                checked={formData.paid}
                onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                className="rounded border-input"
                data-testid="checkbox-invoice-paid"
              />
              <label htmlFor="paid" className="text-sm font-medium text-foreground">
                Tam Ödeme (Fatura tutarının tamamı ödenmiş olarak işaretler)
              </label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 border border-input rounded-md text-foreground hover:bg-accent transition-colors touch-target"
                data-testid="button-cancel-invoice"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-save-invoice"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kaydediliyor...
                  </div>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2 inline-block" />
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>

        {/* Payment Modal */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedInvoice(null);
          }}
          title={selectedInvoice ? `Fatura #${selectedInvoice.id.slice(-8)} - Ödeme Ekle` : "Ödeme Ekle"}
        >
          {selectedInvoice && <Payments invoice={selectedInvoice} />}
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Fatura Detayları"
        >
          {viewingInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Fatura No</label>
                  <p className="text-lg font-semibold text-foreground">{viewingInvoice.invoiceNumber}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Müşteri</label>
                  <p className="text-foreground">
                    {customers.find((c: Customer) => c.id === viewingInvoice.customerId)?.name || 'Müşteri bulunamadı'}
                  </p>
                </div>
                
                {viewingInvoice.description && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Açıklama</label>
                    <p className="text-foreground">{viewingInvoice.description}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Fatura Tutarı</label>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(parseFloat(viewingInvoice.amount.toString()))}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Ödenen Tutar</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(parseFloat(viewingInvoice.paidAmount || "0"))}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Kalan Tutar</label>
                  <p className="text-lg font-semibold text-orange-600">
                    {formatCurrency(parseFloat(viewingInvoice.amount.toString()) - parseFloat(viewingInvoice.paidAmount || "0"))}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Tarih</label>
                  <p className="text-foreground">{formatDate(viewingInvoice.date)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Durum</label>
                  <div className="flex items-center">
                    {getStatusBadge(viewingInvoice)}
                  </div>
                </div>
                
                {/* Payments Section */}
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Yapılan Ödemeler</label>
                  <Payments invoice={viewingInvoice} />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                  data-testid="button-close-view-invoice"
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
