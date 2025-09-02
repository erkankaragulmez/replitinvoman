import { useState } from "react";
import { UserManagement } from "@/components/UserManagement";
import { DataImportExport } from "@/components/DataImportExport";

interface AdminPanelProps {
  user: any;
}

export function AdminPanel({ user }: AdminPanelProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<"users" | "data">("users");

  return (
    <section className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Yönetim Paneli</h1>
        <p className="text-muted-foreground mt-2">
          Kullanıcı yönetimi ve veri işlemlerini buradan gerçekleştirebilirsiniz.
        </p>
      </div>

      {/* Admin Sub-navigation */}
      <div className="bg-card border border-border rounded-lg p-1 mb-6 inline-flex">
        <button
          onClick={() => setActiveAdminTab("users")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeAdminTab === "users"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="admin-tab-users"
        >
          👥 Kullanıcı Yönetimi
        </button>
        <button
          onClick={() => setActiveAdminTab("data")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeAdminTab === "data"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="admin-tab-data"
        >
          📊 Veri İşlemleri
        </button>
      </div>

      {/* Content */}
      {activeAdminTab === "users" && <UserManagement user={user} />}
      {activeAdminTab === "data" && <DataImportExport user={user} />}
    </section>
  );
}