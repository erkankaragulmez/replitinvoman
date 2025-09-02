import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Modal } from "./Modal";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Eye, Edit, Trash2, Plus, User, Shield, Clock } from "lucide-react";

interface UserManagementProps {
  user: any;
}

export function UserManagement({ user }: UserManagementProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users", undefined, {
        adminUserId: user.id
      });
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/users", data, {
        adminUserId: user.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsModalOpen(false);
      resetForm();
      toast({ title: "Başarılı", description: "Kullanıcı eklendi" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Hata", description: error.message || "Kullanıcı eklenemedi" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PUT", `/api/admin/users/${id}`, data, {
        adminUserId: user.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      toast({ title: "Başarılı", description: "Kullanıcı güncellendi" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Hata", description: error.message || "Kullanıcı güncellenemedi" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${id}`, undefined, {
        adminUserId: user.id
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUsers([]);
      toast({ title: "Başarılı", description: "Kullanıcı silindi" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Hata", description: error.message || "Kullanıcı silinemedi" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const promises = userIds.map(id => 
        apiRequest("DELETE", `/api/admin/users/${id}`, undefined, {
          adminUserId: user.id
        })
      );
      await Promise.all(promises);
    },
    onSuccess: (_, userIds) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUsers([]);
      toast({ title: "Başarılı", description: `${userIds.length} kullanıcı silindi` });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Hata", description: error.message || "Kullanıcılar silinemedi" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (userToEdit: any) => {
    setEditingUser(userToEdit);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: "",
      role: userToEdit.role,
      isActive: userToEdit.isActive,
    });
    setIsModalOpen(true);
  };

  const handleView = (userToView: any) => {
    setViewingUser(userToView);
    setIsViewModalOpen(true);
  };

  const handleDelete = (userToDelete: any) => {
    if (confirm(`"${userToDelete.name}" kullanıcısını silmek istediğinizden emin misiniz?`)) {
      deleteMutation.mutate(userToDelete.id);
    }
  };

  const handleBulkDelete = () => {
    const selectableUsers = selectedUsers.filter(id => id !== user.id);
    if (selectableUsers.length === 0) {
      toast({ variant: "destructive", title: "Hata", description: "Silinecek kullanıcı seçin" });
      return;
    }
    
    if (confirm(`${selectableUsers.length} kullanıcıyı silmek istediğinizden emin misiniz?`)) {
      bulkDeleteMutation.mutate(selectableUsers);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableUserIds = users.filter((u: any) => u.id !== user.id).map((u: any) => u.id);
      setSelectedUsers(selectableUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const selectableUsers = users.filter((u: any) => u.id !== user.id);
  const allSelected = selectableUsers.length > 0 && selectedUsers.length === selectableUsers.length;

  const getRoleIcon = (role: string) => {
    return role === "admin" ? <Shield className="w-4 h-4 text-orange-500" /> : <User className="w-4 h-4 text-blue-500" />;
  };

  const getRoleText = (role: string) => {
    return role === "admin" ? "Yönetici" : "Kullanıcı";
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Kullanıcılar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Kullanıcı Yönetimi</h2>
          {selectedUsers.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {selectedUsers.length} kullanıcı seçildi
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          {selectedUsers.length > 0 && (
            <Button
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid="button-bulk-delete"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {bulkDeleteMutation.isPending ? "Siliniyor..." : `Seçilenleri Sil (${selectedUsers.length})`}
            </Button>
          )}
          <Button
            onClick={() => {
              resetForm();
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="bg-green-600 hover:bg-green-700"
            data-testid="button-add-user"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kullanıcı
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border"
                    data-testid="checkbox-select-all"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Son Giriş
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((userItem: any) => (
                <tr key={userItem.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {userItem.id !== user.id && (
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(userItem.id)}
                        onChange={(e) => handleSelectUser(userItem.id, e.target.checked)}
                        className="rounded border-border"
                        data-testid={`checkbox-user-${userItem.id}`}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">{userItem.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {userItem.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {userItem.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getRoleIcon(userItem.role)}
                      <span className="ml-2 text-sm text-foreground">{getRoleText(userItem.role)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      userItem.isActive 
                        ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                        : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                    }`}>
                      {userItem.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {userItem.lastLoginAt ? (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(new Date(userItem.lastLoginAt), "dd MMM yyyy HH:mm", { locale: tr })}
                      </div>
                    ) : (
                      "Hiç giriş yapmadı"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(userItem)}
                        data-testid={`button-view-user-${userItem.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(userItem)}
                        data-testid={`button-edit-user-${userItem.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {userItem.id !== user.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(userItem)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-user-${userItem.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
          resetForm();
        }}
        title={editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Ad Soyad
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              data-testid="input-user-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required
              data-testid="input-user-email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {editingUser ? "Yeni Şifre (Boş bırakın)" : "Şifre"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              required={!editingUser}
              data-testid="input-user-password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              data-testid="select-user-role"
            >
              <option value="user">Kullanıcı</option>
              <option value="admin">Yönetici</option>
            </select>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-border"
                data-testid="checkbox-user-active"
              />
              <span className="text-sm text-foreground">Aktif kullanıcı</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setEditingUser(null);
                resetForm();
              }}
              data-testid="button-cancel-user"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit-user"
            >
              {createMutation.isPending || updateMutation.isPending ? "Kaydediliyor..." : editingUser ? "Güncelle" : "Ekle"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingUser(null);
        }}
        title="Kullanıcı Detayları"
      >
        {viewingUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Ad Soyad</label>
                <p className="text-foreground mt-1">{viewingUser.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground mt-1">{viewingUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Rol</label>
                <div className="flex items-center mt-1">
                  {getRoleIcon(viewingUser.role)}
                  <span className="ml-2 text-foreground">{getRoleText(viewingUser.role)}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Durum</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                  viewingUser.isActive 
                    ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                    : "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                }`}>
                  {viewingUser.isActive ? "Aktif" : "Pasif"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Oluşturulma Tarihi</label>
                <p className="text-foreground mt-1">
                  {format(new Date(viewingUser.createdAt), "dd MMMM yyyy HH:mm", { locale: tr })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Son Giriş</label>
                <p className="text-foreground mt-1">
                  {viewingUser.lastLoginAt 
                    ? format(new Date(viewingUser.lastLoginAt), "dd MMMM yyyy HH:mm", { locale: tr })
                    : "Hiç giriş yapmadı"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}