import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Gmail SMTP configuration (user will provide credentials)
    const emailConfig: EmailConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || ''
      }
    };

    this.transporter = nodemailer.createTransport(emailConfig);
  }

  async sendPasswordResetEmail(toEmail: string, newPassword: string): Promise<boolean> {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('Email credentials not configured');
        return false;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'FaturaYoneticim - Yeni Şifreniz',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Şifre Yenileme</h2>
            <p>Merhaba,</p>
            <p>FaturaYoneticim hesabınız için yeni şifreniz:</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #007bff; font-family: monospace;">${newPassword}</h3>
            </div>
            <p>Güvenliğiniz için bu şifreyi değiştirmenizi öneririz.</p>
            <p>Bu işlemi siz yapmadıysanız, lütfen hemen bizimle iletişime geçin.</p>
            <br>
            <p>Saygılarımızla,<br>FaturaYoneticim Ekibi</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  generateRandomPassword(length: number = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export const emailService = new EmailService();