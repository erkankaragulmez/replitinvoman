import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface GoogleAuthProps {
  onSuccess: (user: any) => void;
}

export function GoogleAuth({ onSuccess }: GoogleAuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    
    try {
      // In a real implementation, you would use Google OAuth library
      // For now, this is a placeholder that simulates the flow
      
      // This would normally be handled by Google OAuth callback
      // const googleResponse = await window.google.accounts.oauth2.initTokenClient({...})
      
      // For demonstration purposes, we'll show how it would work:
      const mockGoogleData = {
        googleId: "mock_google_id_" + Date.now(),
        email: "user@gmail.com",
        name: "Google Kullanıcısı"
      };

      // In real implementation, you would get actual data from Google
      toast({
        variant: "destructive",
        title: "Geliştirme Aşamasında",
        description: "Google OAuth entegrasyonu için Google Developer Console'da OAuth 2.0 Client ID yapılandırması gereklidir."
      });

      // Uncomment this when Google OAuth is properly configured:
      /*
      const response = await apiRequest("POST", "/api/auth/google", mockGoogleData);
      const data = await response.json();
      
      if (response.ok) {
        onSuccess(data.user);
        toast({
          title: "Başarılı",
          description: "Google ile giriş yapıldı."
        });
      } else {
        throw new Error(data.error || "Google ile giriş başarısız");
      }
      */
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Google ile giriş başarısız oldu."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex justify-center items-center py-2 px-4 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
      data-testid="button-google-login"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Google ile giriş yapılıyor...
        </>
      ) : (
        <>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google ile Giriş Yap
        </>
      )}
    </button>
  );
}