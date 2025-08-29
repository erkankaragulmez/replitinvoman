import { useState, useEffect } from "react";
import { Auth } from "@/components/Auth";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { Customers } from "@/components/Customers";
import { Invoices } from "@/components/Invoices";
import { Expenses } from "@/components/Expenses";
import { Reports } from "@/components/Reports";

export default function Home() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedUser");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("loggedUser");
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem("loggedUser", JSON.stringify(userData));
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
      
      {/* Desktop Navigation Tabs */}
      <div className="hidden sm:block bg-card border-b border-border sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { id: "summary", label: "Panel", icon: "📊" },
              { id: "customers", label: "Müşteriler", icon: "👥" },
              { id: "invoices", label: "Faturalar", icon: "📄" },
              { id: "expenses", label: "Masraflar", icon: "💳" },
              { id: "reports", label: "Raporlar", icon: "📈" }
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
        {activeTab === "summary" && <Dashboard user={user} />}
        {activeTab === "customers" && <Customers user={user} />}
        {activeTab === "invoices" && <Invoices user={user} />}
        {activeTab === "expenses" && <Expenses user={user} />}
        {activeTab === "reports" && <Reports user={user} />}
      </main>
    </div>
  );
}
