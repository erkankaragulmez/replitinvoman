import { type User, type Customer, type Invoice, type Expense, type Payment, type PasswordResetRequest, type InsertUser, type InsertCustomer, type InsertInvoice, type InsertExpense, type InsertPayment, type InsertPasswordReset } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  
  // Password reset methods
  createPasswordReset(reset: InsertPasswordReset): Promise<PasswordResetRequest>;
  getPasswordReset(token: string): Promise<PasswordResetRequest | undefined>;
  deletePasswordReset(id: string): Promise<boolean>;
  
  // Customer methods
  getCustomers(userId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  
  // Invoice methods
  getInvoices(userId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<Invoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  
  // Expense methods
  getExpenses(userId: string): Promise<Expense[]>;
  getExpense(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<Expense>): Promise<Expense | undefined>;
  deleteExpense(id: string): Promise<boolean>;
  
  // Payment methods
  getPayments(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  deletePayment(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private customers: Map<string, Customer> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private expenses: Map<string, Expense> = new Map();
  private payments: Map<string, Payment> = new Map();
  private passwordResets: Map<string, PasswordResetRequest> = new Map();

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.googleId === googleId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      googleId: null,
      resetToken: null,
      resetTokenExpiry: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Password reset methods
  async createPasswordReset(insertReset: InsertPasswordReset): Promise<PasswordResetRequest> {
    const id = randomUUID();
    const reset: PasswordResetRequest = { 
      ...insertReset, 
      id,
      createdAt: new Date()
    };
    this.passwordResets.set(id, reset);
    return reset;
  }

  async getPasswordReset(token: string): Promise<PasswordResetRequest | undefined> {
    return Array.from(this.passwordResets.values()).find(reset => reset.token === token);
  }

  async deletePasswordReset(id: string): Promise<boolean> {
    return this.passwordResets.delete(id);
  }

  // Customer methods
  async getCustomers(userId: string): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(customer => customer.userId === userId);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { 
      ...insertCustomer, 
      id,
      address: insertCustomer.address || null,
      email: insertCustomer.email || null,
      phone: insertCustomer.phone || null
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updateData: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...updateData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Invoice methods
  async getInvoices(userId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.userId === userId);
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const paidStatus = insertInvoice.paid || false;
    const paidAmount = paidStatus ? insertInvoice.amount : "0";
    
    // Generate invoice number in FATNNNNNN format
    const invoiceCount = Array.from(this.invoices.values()).filter(inv => inv.userId === insertInvoice.userId).length;
    const invoiceNumber = `FAT${String(invoiceCount + 1).padStart(6, '0')}`;
    
    const invoice: Invoice = { 
      ...insertInvoice, 
      id,
      invoiceNumber,
      description: insertInvoice.description || null,
      paid: paidStatus,
      paidAmount,
      createdAt: new Date()
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  async updateInvoice(id: string, updateData: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = this.invoices.get(id);
    if (!invoice) return undefined;
    
    const updatedInvoice = { ...invoice, ...updateData };
    
    // If paid is set to true, set paidAmount to full amount
    if (updateData.paid === true) {
      updatedInvoice.paidAmount = updatedInvoice.amount;
    }
    // If paid is set to false, reset paidAmount to 0
    else if (updateData.paid === false) {
      updatedInvoice.paidAmount = "0";
    }
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async deleteInvoice(id: string): Promise<boolean> {
    return this.invoices.delete(id);
  }

  // Expense methods
  async getExpenses(userId: string): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => expense.userId === userId);
  }

  async getExpense(id: string): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const id = randomUUID();
    const expense: Expense = { 
      ...insertExpense, 
      id,
      createdAt: new Date()
    };
    this.expenses.set(id, expense);
    return expense;
  }

  async updateExpense(id: string, updateData: Partial<Expense>): Promise<Expense | undefined> {
    const expense = this.expenses.get(id);
    if (!expense) return undefined;
    
    const updatedExpense = { ...expense, ...updateData };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Payment methods
  async getPayments(invoiceId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.invoiceId === invoiceId);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = { 
      ...insertPayment, 
      id,
      notes: insertPayment.notes || null,
      createdAt: new Date()
    };
    this.payments.set(id, payment);
    
    // Update invoice paid amount and status
    await this.updateInvoicePaidAmount(insertPayment.invoiceId);
    
    return payment;
  }

  async deletePayment(id: string): Promise<boolean> {
    const payment = this.payments.get(id);
    if (!payment) return false;
    
    const deleted = this.payments.delete(id);
    if (deleted) {
      // Update invoice paid amount and status
      await this.updateInvoicePaidAmount(payment.invoiceId);
    }
    return deleted;
  }

  private async updateInvoicePaidAmount(invoiceId: string): Promise<void> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return;
    
    const payments = await this.getPayments(invoiceId);
    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const invoiceAmount = parseFloat(invoice.amount);
    
    const updatedInvoice = {
      ...invoice,
      paidAmount: totalPaid.toString(),
      paid: totalPaid >= invoiceAmount
    };
    
    this.invoices.set(invoiceId, updatedInvoice);
  }
}

export const storage = new MemStorage();
