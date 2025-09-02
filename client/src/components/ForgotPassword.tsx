import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

interface ForgotPasswordProps {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: ForgotPasswordProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Email adresi gerekli."
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/forgot-password", { email });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Başarılı",
          description: data.message || "Yeni şifreniz email adresinize gönderildi."
        });
        setEmail("");
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        throw new Error(data.error || "Şifre yenileme başarısız");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Şifre yenileme başarısız oldu."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Şifremi Yenile
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Email adresinizi girin, yeni şifrenizi size gönderelim
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-muted-foreground mb-2">
              Email Adresi
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="ornek@email.com"
              data-testid="input-forgot-email"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-send-reset"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                "Yeni Şifre Gönder"
              )}
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full flex justify-center items-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-muted-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Giriş Sayfasına Dön
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                Email ayarları hakkında
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground text-center">
            Email gönderimi için sistem yöneticisinin email ayarlarını yapılandırması gerekir.
            Gmail SMTP kullanılmaktadır.
          </p>
        </div>
      </div>
    </div>
  );
}