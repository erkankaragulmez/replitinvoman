import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Modal } from "./Modal";
import { Plus, Edit2, Trash2, Users, Search, Phone, Mail, Eye } from "lucide-react";
import type { Customer } from "@shared/schema";

interface CustomersProps {
  user: any;
}

export function Customers({ user }: CustomersProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Load saved form data on component mount
  useEffect(() => {
    const savedCustomerData = localStorage.getItem('customerFormData');
    if (savedCustomerData) {
      try {
        const parsedData = JSON.parse(savedCustomerData);
        setFormData(prev => ({
          ...prev,
          ...parsedData
        }));
      } catch (error) {
        console.error('Error loading saved customer data:', error);
      }
    }
  }, []);

  // Save form data to localStorage whenever formData changes
  const saveFormData = (data: typeof formData) => {
    localStorage.setItem('customerFormData', JSON.stringify(data));
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers", user.id],
    queryFn: async () => {
      const res = await fetch(`/api/customers?userId=${user.id}`);
      if (!res.ok) throw new Error("Müşteriler alınamadı");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/customers", { ...data, userId: user.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", user.id] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Başarılı", description: "Müşteri eklendi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Müşteri eklenemedi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/customers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", user.id] });
      setIsModalOpen(false);
      setEditingCustomer(null);
      resetForm();
      toast({ title: "Başarılı", description: "Müşteri güncellendi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Müşteri güncellenemedi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/customers/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", user.id] });
      toast({ title: "Başarılı", description: "Müşteri silindi" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Hata", description: "Müşteri silinemedi" });
    },
  });

  const resetForm = () => {
    const emptyForm = { name: "", phone: "", email: "", address: "" };
    setFormData(emptyForm);
    localStorage.removeItem('customerFormData');
  };

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    if (!editingCustomer) {
      // Only save to localStorage if not editing (for new customers)
      saveFormData(updatedData);
    }
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
      });
    } else {
      setEditingCustomer(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const openViewModal = (customer: Customer) => {
    setViewingCustomer(customer);
    setIsViewModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "Hata", description: "Müşteri ismi gereklidir" });
      return;
    }

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredCustomers = customers.filter((customer: Customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
            <Users className="h-6 w-6 mr-2" />
            Müşteriler
          </h2>
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-colors touch-target flex items-center justify-center"
            data-testid="button-new-customer"
          >
            <Plus className="h-4 w-4 mr-2" />
            Yeni Müşteri
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
              data-testid="input-search-customers"
            />
          </div>
        </div>

        {/* Customers List */}
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? "Arama kriterlerinize uygun müşteri bulunamadı" : "Henüz müşteri yok"}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer: Customer) => (
              <div
                key={customer.id}
                className="bg-muted/30 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground" data-testid={`customer-name-${customer.id}`}>
                      {customer.name}
                    </h4>
                    <div className="space-y-1 mt-2">
                      {customer.phone && (
                        <p className="text-muted-foreground text-sm flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-muted-foreground text-sm flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {customer.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 self-start sm:self-center">
                    <button
                      onClick={() => openViewModal(customer)}
                      className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-accent rounded-md transition-colors touch-target"
                      title="Görüntüle"
                      data-testid={`button-view-customer-${customer.id}`}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openModal(customer)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors touch-target"
                      title="Düzenle"
                      data-testid={`button-edit-customer-${customer.id}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-accent rounded-md transition-colors touch-target"
                      title="Sil"
                      data-testid={`button-delete-customer-${customer.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCustomer ? "Müşteri Düzenle" : "Yeni Müşteri"}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Müşteri İsmi <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                placeholder="Müşteri adı girin"
                required
                data-testid="input-customer-name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                placeholder="ornek@email.com"
                data-testid="input-customer-email"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Telefon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base touch-target"
                placeholder="+90 555 123 45 67"
                data-testid="input-customer-phone"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Adres</label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base min-h-[88px]"
                placeholder="Müşteri adresi"
                rows={3}
                data-testid="input-customer-address"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 border border-input rounded-md text-foreground hover:bg-accent transition-colors touch-target"
                data-testid="button-cancel-customer"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full sm:w-auto bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-save-customer"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Kaydediliyor...
                  </div>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2 inline-block" />
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
          title="Müşteri Detayları"
        >
          {viewingCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Müşteri İsmi</label>
                  <p className="text-lg font-semibold text-foreground">{viewingCustomer.name}</p>
                </div>
                
                {viewingCustomer.email && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                    <p className="text-foreground flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {viewingCustomer.email}
                    </p>
                  </div>
                )}
                
                {viewingCustomer.phone && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Telefon</label>
                    <p className="text-foreground flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      {viewingCustomer.phone}
                    </p>
                  </div>
                )}
                
                {viewingCustomer.address && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Adres</label>
                    <p className="text-foreground whitespace-pre-wrap">{viewingCustomer.address}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                  data-testid="button-close-view-customer"
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
