import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCustomerSchema, insertInvoiceSchema, insertExpenseSchema, insertPaymentSchema, insertPasswordResetSchema } from "@shared/schema";
import { emailService } from "./emailService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Bu email zaten kayıtlı!" });
      }
      
      const user = await storage.createUser(userData);
      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      res.status(400).json({ error: "Kayıt başarısız oldu." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Email veya şifre yanlış." });
      }
      
      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      res.status(400).json({ error: "Giriş başarısız oldu." });
    }
  });

  // Password Reset Routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email adresi gerekli." });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ error: "Bu email adresi ile kayıtlı kullanıcı bulunamadı." });
      }

      // Generate new password
      const newPassword = emailService.generateRandomPassword(8);
      const token = emailService.generateRandomPassword(32);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create password reset request
      await storage.createPasswordReset({
        email: user.email,
        token,
        newPassword,
        expiresAt
      });

      // Send email
      const emailSent = await emailService.sendPasswordResetEmail(user.email, newPassword);
      
      if (!emailSent) {
        return res.status(500).json({ error: "Email gönderilirken hata oluştu. Email ayarlarını kontrol edin." });
      }

      res.json({ message: "Yeni şifreniz email adresinize gönderildi." });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: "Şifre yenileme işlemi başarısız oldu." });
    }
  });

  // Google OAuth routes (placeholder - requires Google OAuth setup)
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { googleId, email, name } = req.body;
      
      if (!googleId || !email || !name) {
        return res.status(400).json({ error: "Google bilgileri eksik." });
      }

      // Check if user exists with Google ID
      let user = await storage.getUserByGoogleId(googleId);
      
      if (!user) {
        // Check if user exists with email
        user = await storage.getUserByEmail(email);
        
        if (user) {
          // Link Google account to existing user
          await storage.updateUser(user.id, { googleId });
        } else {
          // Create new user with Google account
          user = await storage.createUser({
            name,
            email,
            password: emailService.generateRandomPassword(16) // Random password for Google users
          });
          await storage.updateUser(user.id, { googleId });
        }
      }

      res.json({ user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({ error: "Google ile giriş başarısız oldu." });
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "User ID gerekli" });
      
      const customers = await storage.getCustomers(userId as string);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Müşteriler alınamadı" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Müşteri oluşturulamadı" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const customer = await storage.updateCustomer(id, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Müşteri bulunamadı" });
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ error: "Müşteri güncellenemedi" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCustomer(id);
      if (!deleted) {
        return res.status(404).json({ error: "Müşteri bulunamadı" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Müşteri silinemedi" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "User ID gerekli" });
      
      const invoices = await storage.getInvoices(userId as string);
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Faturalar alınamadı" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      // Convert amount to string if it's a number
      const requestData = {
        ...req.body,
        amount: typeof req.body.amount === 'number' ? req.body.amount.toString() : req.body.amount
      };
      const invoiceData = insertInvoiceSchema.parse(requestData);
      const invoice = await storage.createInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      console.error("Invoice creation error:", error);
      res.status(400).json({ error: "Fatura oluşturulamadı", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/invoices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Convert amount to string if it's a number
      const updateData = {
        ...req.body,
        amount: req.body.amount && typeof req.body.amount === 'number' ? req.body.amount.toString() : req.body.amount
      };
      const invoice = await storage.updateInvoice(id, updateData);
      if (!invoice) {
        return res.status(404).json({ error: "Fatura bulunamadı" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Invoice update error:", error);
      res.status(400).json({ error: "Fatura güncellenemedi" });
    }
  });

  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteInvoice(id);
      if (!deleted) {
        return res.status(404).json({ error: "Fatura bulunamadı" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Fatura silinemedi" });
    }
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "User ID gerekli" });
      
      const expenses = await storage.getExpenses(userId as string);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Masraflar alınamadı" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      // Convert amount to string if it's a number
      const requestData = {
        ...req.body,
        amount: typeof req.body.amount === 'number' ? req.body.amount.toString() : req.body.amount
      };
      const expenseData = insertExpenseSchema.parse(requestData);
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Expense creation error:", error);
      res.status(400).json({ error: "Masraf oluşturulamadı", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      // Convert amount to string if it's a number
      const updateData = {
        ...req.body,
        amount: req.body.amount && typeof req.body.amount === 'number' ? req.body.amount.toString() : req.body.amount
      };
      const expense = await storage.updateExpense(id, updateData);
      if (!expense) {
        return res.status(404).json({ error: "Masraf bulunamadı" });
      }
      res.json(expense);
    } catch (error) {
      console.error("Expense update error:", error);
      res.status(400).json({ error: "Masraf güncellenemedi" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        return res.status(404).json({ error: "Masraf bulunamadı" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Masraf silinemedi" });
    }
  });

  // Payment routes
  app.get("/api/payments/:invoiceId", async (req, res) => {
    try {
      const { invoiceId } = req.params;
      const payments = await storage.getPayments(invoiceId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: "Ödemeler alınamadı" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      // Convert amount to string if it's a number
      const requestData = {
        ...req.body,
        amount: typeof req.body.amount === 'number' ? req.body.amount.toString() : req.body.amount
      };
      const paymentData = insertPaymentSchema.parse(requestData);
      const payment = await storage.createPayment(paymentData);
      res.json(payment);
    } catch (error) {
      console.error("Payment creation error:", error);
      res.status(400).json({ error: "Ödeme oluşturulamadı", details: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/payments/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePayment(id);
      if (!deleted) {
        return res.status(404).json({ error: "Ödeme bulunamadı" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Ödeme silinemedi" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
