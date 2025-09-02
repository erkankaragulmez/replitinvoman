import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";
import { ForgotPassword } from "./ForgotPassword";
import { GoogleAuth } from "./GoogleAuth";

interface AuthProps {
  onLogin: (user: any) => void;
}

export function Auth({ onLogin }: AuthProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // Show forgot password screen
  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      onLogin(data.user);
      toast({
        title: "Başarılı",
        description: "Giriş yapıldı",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Giriş yapılamadı",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Kayıt başarılı! Giriş yapabilirsiniz.",
      });
      setIsRegister(false);
      setName("");
      setEmail("");
      setPassword("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Kayıt yapılamadı",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegister) {
      if (!name.trim() || !email.trim() || !password.trim()) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Lütfen tüm alanları doldurun.",
        });
        return;
      }
      registerMutation.mutate({ name, email, password });
    } else {
      if (!email.trim() || !password.trim()) {
        toast({
          variant: "destructive",
          title: "Hata",
          description: "Email ve şifre gereklidir.",
        });
        return;
      }
      loginMutation.mutate({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-xl border border-border p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <svg className="h-8 w-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                </svg>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
              FaturaYoneticim
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Fatura yönetim sisteminize hoş geldiniz
            </p>
          </div>
          
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    İsim <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm sm:text-base touch-target"
                    placeholder="Adınızı girin"
                    required={isRegister}
                    data-testid="input-name"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm sm:text-base touch-target"
                  placeholder="ornek@email.com"
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Şifre <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm sm:text-base touch-target"
                  placeholder="••••••••"
                  required
                  data-testid="input-password"
                />
              </div>
              <button
                type="submit"
                disabled={loginMutation.isPending || registerMutation.isPending}
                className="w-full bg-primary text-primary-foreground py-2.5 px-4 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors text-sm sm:text-base touch-target disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-submit"
              >
                {(loginMutation.isPending || registerMutation.isPending) ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isRegister ? "Kaydediliyor..." : "Giriş yapılıyor..."}
                  </div>
                ) : (
                  isRegister ? "Kayıt Ol" : "Giriş Yap"
                )}
              </button>
            </form>

            {!isRegister && (
              <div className="text-center">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                  data-testid="forgot-password-link"
                >
                  Şifremi Unuttum
                </button>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">veya</span>
              </div>
            </div>

            <GoogleAuth onSuccess={onLogin} />
            
            <div className="text-center">
              <p className="text-muted-foreground text-sm">
                {isRegister ? "Zaten kayıtlı mısınız? " : "Hesabınız yok mu? "}
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-primary hover:underline font-medium"
                  data-testid="toggle-auth-mode"
                >
                  {isRegister ? "Giriş Yap" : "Kayıt Ol"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
