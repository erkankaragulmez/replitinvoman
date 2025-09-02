import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import { Download, Upload, FileText, Users, Receipt, CreditCard, AlertTriangle } from "lucide-react";

interface DataImportExportProps {
  user: any;
}

type DataType = "customers" | "invoices" | "expenses" | "users";

export function DataImportExport({ user }: DataImportExportProps) {
  const [selectedType, setSelectedType] = useState<DataType>("customers");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users for selection
  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users", undefined, {
        adminUserId: user.id
      });
      return res.json();
    },
  });

  const exportMutation = useMutation({
    mutationFn: async ({ type, userId }: { type: DataType; userId?: string }) => {
      const url = `/api/admin/export/${type}${userId ? `?userId=${userId}` : ""}`;
      const res = await fetch(url, {
        headers: {
          adminUserId: user.id
        }
      });
      
      if (!res.ok) throw new Error("Export başarısız");
      
      // If no data, show message
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        if (data.message) {
          toast({ title: "Bilgi", description: data.message });
          return;
        }
      }
      
      // Download file
      const blob = await res.blob();
      const filename = res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") || `${type}.csv`;
      
      const url2 = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url2;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url2);
      document.body.removeChild(a);
      
      toast({ title: "Başarılı", description: "Veri dışa aktarıldı" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Hata", description: error.message || "Dışa aktarma başarısız" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ type, data, userId }: { type: DataType; data: any[]; userId?: string }) => {
      const res = await apiRequest("POST", `/api/admin/import/${type}`, { data, userId }, {
        adminUserId: user.id
      });
      return res.json();
    },
    onSuccess: (result) => {
      setImportFile(null);
      setImportData([]);
      setShowImportPreview(false);
      queryClient.invalidateQueries();
      
      const message = result.errors && result.errors.length > 0 
        ? `${result.importedCount}/${result.totalCount} kayıt içe aktarıldı. ${result.errors.length} hata oluştu.`
        : `${result.importedCount} kayıt başarıyla içe aktarıldı.`;
      
      toast({ 
        title: result.errors && result.errors.length > 0 ? "Kısmi Başarı" : "Başarılı", 
        description: message,
        variant: result.errors && result.errors.length > 0 ? "default" : "default"
      });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Hata", description: error.message || "İçe aktarma başarısız" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({ variant: "destructive", title: "Hata", description: "Sadece CSV dosyaları desteklenmektedir" });
      return;
    }

    setImportFile(file);
    
    // Parse CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({ variant: "destructive", title: "Hata", description: "CSV dosyası geçerli veri içermiyor" });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || null;
        });
        return obj;
      });

      setImportData(data);
      setShowImportPreview(true);
    };
    
    reader.readAsText(file);
  };

  const handleExport = () => {
    if ((selectedType === "customers" || selectedType === "invoices" || selectedType === "expenses") && !selectedUserId) {
      toast({ variant: "destructive", title: "Hata", description: "Lütfen bir kullanıcı seçin" });
      return;
    }
    
    exportMutation.mutate({ 
      type: selectedType, 
      userId: selectedType === "users" ? undefined : selectedUserId 
    });
  };

  const handleImport = () => {
    if (importData.length === 0) {
      toast({ variant: "destructive", title: "Hata", description: "İçe aktarılacak veri bulunamadı" });
      return;
    }

    if ((selectedType === "customers" || selectedType === "invoices" || selectedType === "expenses") && !selectedUserId) {
      toast({ variant: "destructive", title: "Hata", description: "Lütfen bir kullanıcı seçin" });
      return;
    }

    importMutation.mutate({ 
      type: selectedType, 
      data: importData,
      userId: selectedType === "users" ? undefined : selectedUserId 
    });
  };

  const getTypeIcon = (type: DataType) => {
    switch (type) {
      case "customers": return <Users className="w-5 h-5" />;
      case "invoices": return <FileText className="w-5 h-5" />;
      case "expenses": return <CreditCard className="w-5 h-5" />;
      case "users": return <Users className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeName = (type: DataType) => {
    switch (type) {
      case "customers": return "Müşteriler";
      case "invoices": return "Faturalar";
      case "expenses": return "Masraflar";
      case "users": return "Kullanıcılar";
      default: return "";
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">Veri İçe/Dışa Aktarma</h2>
        <p className="text-muted-foreground">
          Sistem verilerini CSV formatında içe aktarabilir veya dışa aktarabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Veri Dışa Aktarma
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Veri Tipi
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DataType)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="select-export-type"
              >
                <option value="customers">Müşteriler</option>
                <option value="invoices">Faturalar</option>
                <option value="expenses">Masraflar</option>
                <option value="users">Kullanıcılar</option>
              </select>
            </div>

            {selectedType !== "users" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kullanıcı
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="select-export-user"
                >
                  <option value="">Kullanıcı seçin...</option>
                  {users.map((userItem: any) => (
                    <option key={userItem.id} value={userItem.id}>
                      {userItem.name} ({userItem.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="w-full"
              data-testid="button-export"
            >
              {exportMutation.isPending ? "Dışa aktarılıyor..." : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  CSV Olarak Dışa Aktar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Veri İçe Aktarma
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Veri Tipi
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DataType)}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="select-import-type"
              >
                <option value="customers">Müşteriler</option>
                <option value="invoices">Faturalar</option>
                <option value="expenses">Masraflar</option>
                <option value="users">Kullanıcılar</option>
              </select>
            </div>

            {selectedType !== "users" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Kullanıcı
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  data-testid="select-import-user"
                >
                  <option value="">Kullanıcı seçin...</option>
                  {users.map((userItem: any) => (
                    <option key={userItem.id} value={userItem.id}>
                      {userItem.name} ({userItem.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                CSV Dosyası
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                data-testid="input-import-file"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sadece CSV formatında dosyalar kabul edilmektedir.
              </p>
            </div>

            {showImportPreview && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <div className="flex items-center mb-2">
                  <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
                  <span className="text-sm font-medium">Önizleme</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {importData.length} kayıt bulundu. İçe aktarmak için "İçe Aktar" butonuna tıklayın.
                </p>
                <div className="max-h-32 overflow-y-auto bg-background border border-border rounded p-2">
                  <pre className="text-xs">{JSON.stringify(importData.slice(0, 3), null, 2)}</pre>
                  {importData.length > 3 && (
                    <p className="text-xs text-muted-foreground mt-1">... ve {importData.length - 3} kayıt daha</p>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={handleImport}
              disabled={!showImportPreview || importMutation.isPending}
              className="w-full"
              data-testid="button-import"
            >
              {importMutation.isPending ? "İçe aktarılıyor..." : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  İçe Aktar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          ℹ️ Kullanım Bilgileri
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <p>• CSV dosyalarınızın UTF-8 kodlamasında olduğundan emin olun</p>
          <p>• İlk satır sütun başlıklarını içermelidir</p>
          <p>• Virgül (,) ayırıcı olarak kullanılmalıdır</p>
          <p>• Tarihlerin YYYY-MM-DD formatında olması önerilir</p>
          <p>• Büyük dosyalar için içe aktarma işlemi biraz zaman alabilir</p>
        </div>
      </div>
    </div>
  );
}