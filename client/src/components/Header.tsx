import { useState } from "react";
import { Menu, Bell, RefreshCw, User, LogOut } from "lucide-react";

interface HeaderProps {
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Header({ onLogout, activeTab, onTabChange }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent touch-target"
              aria-label="Toggle navigation menu"
              data-testid="mobile-menu-toggle"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center">
              <div className="p-2 bg-primary/10 rounded-full mr-3">
                <svg className="h-6 w-6 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                Invoice<span className="text-primary">Manager</span>
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center space-x-6">
            <button 
              className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors touch-target" 
              title="Bildirimler"
              data-testid="notifications-button"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button 
              className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors touch-target" 
              title="Senkronize"
              onClick={() => window.location.reload()}
              data-testid="sync-button"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button 
              className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors touch-target" 
              title="Profil"
              data-testid="profile-button"
            >
              <User className="h-5 w-5" />
            </button>
            <button
              onClick={onLogout}
              className="text-muted-foreground hover:text-destructive p-2 rounded-md hover:bg-accent transition-colors touch-target"
              title="Çıkış"
              data-testid="logout-button"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </nav>

          {/* Mobile Navigation Icons */}
          <div className="flex sm:hidden items-center space-x-2">
            <button 
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent touch-target" 
              title="Bildirimler"
              data-testid="mobile-notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button 
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent touch-target" 
              title="Profil"
              data-testid="mobile-profile"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-border bg-card" data-testid="mobile-menu">
          <div className="px-4 py-4 space-y-2">
            <button
              onClick={() => handleTabClick("summary")}
              className={`w-full text-left px-4 py-3 rounded-md font-medium transition-colors touch-target ${
                activeTab === "summary" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-foreground hover:bg-accent"
              }`}
              data-testid="mobile-nav-summary"
            >
              <svg className="inline-block h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
              </svg>
              Panel
            </button>
            <button
              onClick={() => handleTabClick("customers")}
              className={`w-full text-left px-4 py-3 rounded-md font-medium transition-colors touch-target ${
                activeTab === "customers" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-foreground hover:bg-accent"
              }`}
              data-testid="mobile-nav-customers"
            >
              <svg className="inline-block h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/>
              </svg>
              Müşteriler
            </button>
            <button
              onClick={() => handleTabClick("invoices")}
              className={`w-full text-left px-4 py-3 rounded-md font-medium transition-colors touch-target ${
                activeTab === "invoices" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-foreground hover:bg-accent"
              }`}
              data-testid="mobile-nav-invoices"
            >
              <svg className="inline-block h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
              </svg>
              Faturalar
            </button>
            <button
              onClick={() => handleTabClick("expenses")}
              className={`w-full text-left px-4 py-3 rounded-md font-medium transition-colors touch-target ${
                activeTab === "expenses" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-foreground hover:bg-accent"
              }`}
              data-testid="mobile-nav-expenses"
            >
              <svg className="inline-block h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Masraflar
            </button>
            <div className="border-t border-border my-2"></div>
            <button 
              className="w-full text-left px-4 py-3 rounded-md text-muted-foreground hover:bg-accent touch-target"
              onClick={() => window.location.reload()}
              data-testid="mobile-sync"
            >
              <RefreshCw className="inline-block h-5 w-5 mr-3" />
              Senkronize
            </button>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-3 rounded-md text-destructive hover:bg-accent touch-target"
              data-testid="mobile-logout"
            >
              <LogOut className="inline-block h-5 w-5 mr-3" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
