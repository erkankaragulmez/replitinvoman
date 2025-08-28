import { useState, useEffect } from "react";
import { Auth } from "@/components/Auth";
import { Header } from "@/components/Header";
import { Dashboard } from "@/components/Dashboard";
import { Customers } from "@/components/Customers";
import { Invoices } from "@/components/Invoices";
import { Expenses } from "@/components/Expenses";

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
      
      <main className="flex-1">
        {activeTab === "summary" && <Dashboard user={user} />}
        {activeTab === "customers" && <Customers user={user} />}
        {activeTab === "invoices" && <Invoices user={user} />}
        {activeTab === "expenses" && <Expenses user={user} />}
      </main>
    </div>
  );
}
