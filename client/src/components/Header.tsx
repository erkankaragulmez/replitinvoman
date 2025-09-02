import { useState, useEffect, useRef } from "react";
import { Menu, Bell, RefreshCw, User, LogOut, ChevronDown } from "lucide-react";

interface HeaderProps {
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  user?: any;
}

export function Header({ onLogout, activeTab, onTabChange, user }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isProfileMenuOpen]);

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
                Fatura<span className="text-primary">Yoneticim</span>
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
            <div className="relative" ref={profileRef}>
              <button 
                className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors flex items-center space-x-1" 
                style={{ 
                  minWidth: '44px', 
                  minHeight: '44px',
                  zIndex: 1000,
                  position: 'relative'
                }}
                title="Profil"
                onClick={(e) => {
                  console.log('CLICK EVENT TRIGGERED!');
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Desktop Profile button clicked, current state:', isProfileMenuOpen);
                  setIsProfileMenuOpen(prev => {
                    console.log('Setting profile menu to:', !prev);
                    return !prev;
                  });
                }}
                onMouseDown={() => console.log('MOUSE DOWN on profile button')}
                onMouseUp={() => console.log('MOUSE UP on profile button')}
                data-testid="profile-button"
              >
                <User className="h-5 w-5" />
                <ChevronDown className="h-3 w-3" />
              </button>
              
              {/* Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[9999]" style={{ zIndex: 9999 }}>
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user?.name || 'Kullanıcı'}</p>
                        <p className="text-sm text-muted-foreground">{user?.email || 'email@example.com'}</p>
                        <p className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary mt-1 inline-block">
                          {user?.role === 'admin' ? '👑 Admin' : '👤 Kullanıcı'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent rounded-md transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            <div className="relative" ref={profileRef}>
              <button 
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent touch-target" 
                title="Profil"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Mobile Profile button clicked, current state:', isProfileMenuOpen);
                  setIsProfileMenuOpen(prev => !prev);
                }}
                data-testid="mobile-profile"
              >
                <User className="h-5 w-5" />
              </button>
              
              {/* Mobile Profile Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[9999]" style={{ zIndex: 9999 }}>
                  <div className="p-4 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user?.name || 'Kullanıcı'}</p>
                        <p className="text-sm text-muted-foreground">{user?.email || 'email@example.com'}</p>
                        <p className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary mt-1 inline-block">
                          {user?.role === 'admin' ? '👑 Admin' : '👤 Kullanıcı'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-accent rounded-md transition-colors flex items-center space-x-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
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
            <button
              onClick={() => handleTabClick("reports")}
              className={`w-full text-left px-4 py-3 rounded-md font-medium transition-colors touch-target ${
                activeTab === "reports" 
                  ? "bg-primary text-primary-foreground" 
                  : "text-foreground hover:bg-accent"
              }`}
              data-testid="mobile-nav-reports"
            >
              <svg className="inline-block h-5 w-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
              Raporlar
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
