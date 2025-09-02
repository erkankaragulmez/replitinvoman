import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { insertUserSchema, insertCustomerSchema, insertInvoiceSchema, insertExpenseSchema, insertPaymentSchema } from "@shared/schema";

// Admin middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const { adminUserId } = req.headers;
    if (!adminUserId) {
      return res.status(401).json({ error: "Admin yetki gerekli" });
    }
    
    const adminUser = await storage.getUser(adminUserId as string);
    if (!adminUser || adminUser.role !== "admin") {
      return res.status(403).json({ error: "Admin yetkisi gerekli" });
    }
    
    req.adminUser = adminUser;
    next();
  } catch (error) {
    res.status(401).json({ error: "Yetki doğrulaması başarısız" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve admin test page
  app.get("/admin-test", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/src/admin-test.html"));
  });
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
      
      if (!user.isActive) {
        return res.status(401).json({ error: "Hesabınız aktif değil." });
      }
      
      // Update last login
      await storage.updateLastLogin(user.id);
      
      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      res.status(400).json({ error: "Giriş başarısız oldu." });
    }
  });

  // Admin User Management Routes
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Kullanıcılar alınamadı" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Bu email zaten kayıtlı!" });
      }
      
      const user = await storage.createUser(userData);
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(400).json({ error: "Kullanıcı oluşturulamadı" });
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { password, ...updateData } = req.body;
      
      // Hash password if provided (in real app you'd hash it)
      const finalUpdateData = password ? { ...updateData, password } : updateData;
      
      const user = await storage.updateUser(id, finalUpdateData);
      if (!user) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(400).json({ error: "Kullanıcı güncellenemedi" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { adminUser } = req;
      
      // Prevent admin from deleting themselves
      if (id === adminUser.id) {
        return res.status(400).json({ error: "Kendi hesabınızı silemezsiniz" });
      }
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Kullanıcı silinemedi" });
    }
  });

  // Temporary admin maker endpoint (for testing)
  app.post("/api/make-admin", async (req, res) => {
    try {
      const { email } = req.body;
      console.log("Making admin:", email);
      const user = await storage.getUserByEmail(email);
      console.log("Found user:", user ? { id: user.id, role: user.role } : "not found");
      
      const success = await storage.makeUserAdmin(email);
      console.log("Admin operation result:", success);
      
      if (success) {
        const updatedUser = await storage.getUserByEmail(email);
        console.log("Updated user:", updatedUser ? { id: updatedUser.id, role: updatedUser.role } : "not found");
        res.json({ success: true, message: "Kullanıcı admin yapıldı", user: updatedUser });
      } else {
        res.status(404).json({ error: "Kullanıcı bulunamadı" });
      }
    } catch (error) {
      console.error("Admin yapma hatası:", error);
      res.status(500).json({ error: "Admin yapma işlemi başarısız" });
    }
  });

  // Data Export/Import Routes
  app.get("/api/admin/export/:type", requireAdmin, async (req, res) => {
    try {
      const { type } = req.params;
      const { userId } = req.query;
      
      let data: any[] = [];
      let filename = "";
      
      switch (type) {
        case "customers":
          data = userId ? await storage.getCustomers(userId as string) : [];
          filename = "musteriler.csv";
          break;
        case "invoices":
          data = userId ? await storage.getInvoices(userId as string) : [];
          filename = "faturalar.csv";
          break;
        case "expenses":
          data = userId ? await storage.getExpenses(userId as string) : [];
          filename = "masraflar.csv";
          break;
        case "users":
          const users = await storage.getAllUsers();
          data = users.map(({ password, ...user }) => user);
          filename = "kullanicilar.csv";
          break;
        default:
          return res.status(400).json({ error: "Geçersiz export tipi" });
      }
      
      if (data.length === 0) {
        return res.json({ message: "Dışa aktarılacak veri bulunamadı", data: [] });
      }
      
      // Convert to CSV
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map(row => headers.map(header => {
          const value = row[header];
          // Handle comma and quotes in data
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(","))
      ].join("\n");
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\ufeff' + csv); // BOM for proper Turkish character display
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Dışa aktarma başarısız" });
    }
  });

  app.post("/api/admin/import/:type", requireAdmin, async (req, res) => {
    try {
      const { type } = req.params;
      const { data, userId } = req.body;
      
      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: "Geçerli veri array'i gerekli" });
      }
      
      let importedCount = 0;
      let errors: string[] = [];
      
      for (const item of data) {
        try {
          switch (type) {
            case "customers":
              if (!userId) throw new Error("User ID gerekli");
              await storage.createCustomer({ ...item, userId });
              break;
            case "invoices":
              if (!userId) throw new Error("User ID gerekli");
              await storage.createInvoice({ ...item, userId });
              break;
            case "expenses":
              if (!userId) throw new Error("User ID gerekli");
              await storage.createExpense({ ...item, userId });
              break;
            case "users":
              await storage.createUser(item);
              break;
            default:
              throw new Error("Geçersiz import tipi");
          }
          importedCount++;
        } catch (error) {
          errors.push(`Satır ${importedCount + 1}: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        }
      }
      
      res.json({
        success: true,
        importedCount,
        totalCount: data.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ error: "İçe aktarma başarısız" });
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
