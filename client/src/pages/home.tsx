import { useState, useEffect } from "react";
import { Auth } from "@/components/Auth";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { Customers } from "@/components/Customers";
import { Invoices } from "@/components/Invoices";
import { Expenses } from "@/components/Expenses";
import { Reports } from "@/components/Reports";
import { AdminPanel } from "../components/AdminPanel";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Force admin role if email is erkan@mail.com
        if (userData.email === "erkan@mail.com") {
          userData.role = "admin";
          localStorage.setItem("loggedUser", JSON.stringify(userData));
        }
        setUser(userData);
      } catch (error) {
        localStorage.removeItem("loggedUser");
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem("loggedUser", JSON.stringify(userData));
  };

  // Debug: Refresh user data from API
  const refreshUserData = async () => {
    try {
      const storedUser = localStorage.getItem("loggedUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Make a fresh login call to get updated user data
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: parsedUser.email, password: "123456" })
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          localStorage.setItem("loggedUser", JSON.stringify(data.user));
        }
      }
    } catch (error) {
      console.error("User data refresh failed:", error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("loggedUser");
    setActiveTab("summary");
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header 
        onLogout={handleLogout} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {/* Debug info - temporary */}
      <div className="bg-yellow-100 dark:bg-yellow-900 p-3 text-center border-b">
        <div className="text-sm">
          <strong>Debug:</strong> Role = "{user?.role || 'undefined'}" | 
          Email = "{user?.email}" | 
          Admin sekmesi = {user && user.role === "admin" ? "✅ Görünmeli" : "❌ Görünmez"}
        </div>
        <button 
          onClick={refreshUserData}
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          🔄 Admin Yetkisini Kontrol Et
        </button>
      </div>
      
      {/* Desktop Navigation Tabs */}
      <div className="hidden sm:block bg-card border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: "summary", label: "Panel", icon: "📊" },
              { id: "customers", label: "Müşteriler", icon: "👥" },
              { id: "invoices", label: "Faturalar", icon: "📄" },
              { id: "expenses", label: "Masraflar", icon: "💳" },
              { id: "reports", label: "Raporlar", icon: "📈" },
              { id: "admin", label: "Yönetim", icon: "⚙️" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors touch-target ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                }`}
                data-testid={`nav-${tab.id}`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      <main className="flex-1">
        {activeTab === "summary" && <Dashboard user={user} onTabChange={setActiveTab} />}
        {activeTab === "customers" && <Customers user={user} />}
        {activeTab === "invoices" && <Invoices user={user} />}
        {activeTab === "expenses" && <Expenses user={user} />}
        {activeTab === "reports" && <Reports user={user} />}
        {activeTab === "admin" && <AdminPanel user={user} />}
      </main>
    </div>
  );
}
