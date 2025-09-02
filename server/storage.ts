import { type User, type Customer, type Invoice, type Expense, type Payment, type InsertUser, type InsertCustomer, type InsertInvoice, type InsertExpense, type InsertPayment } from "@shared/schema";
import { randomUUID } from "crypto";

// Type augmentation for global storage
declare global {
  var __storage_users__: Map<string, User> | undefined;
  var __storage_customers__: Map<string, Customer> | undefined;
  var __storage_invoices__: Map<string, Invoice> | undefined;
  var __storage_expenses__: Map<string, Expense> | undefined;
  var __storage_payments__: Map<string, Payment> | undefined;
  var __storage_instance__: MemStorage | undefined;
}

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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

// Global storage maps to persist across hot reloads
const globalUsers = global.__storage_users__ || (global.__storage_users__ = new Map<string, User>());
const globalCustomers = global.__storage_customers__ || (global.__storage_customers__ = new Map<string, Customer>());
const globalInvoices = global.__storage_invoices__ || (global.__storage_invoices__ = new Map<string, Invoice>());
const globalExpenses = global.__storage_expenses__ || (global.__storage_expenses__ = new Map<string, Expense>());
const globalPayments = global.__storage_payments__ || (global.__storage_payments__ = new Map<string, Payment>());

export class MemStorage implements IStorage {
  private users: Map<string, User> = globalUsers;
  private customers: Map<string, Customer> = globalCustomers;
  private invoices: Map<string, Invoice> = globalInvoices;
  private expenses: Map<string, Expense> = globalExpenses;
  private payments: Map<string, Payment> = globalPayments;

  constructor() {
    // Load data from file system on startup
    this.loadFromFile();
  }

  private saveToFile() {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        customers: Array.from(this.customers.entries()),
        invoices: Array.from(this.invoices.entries()),
        expenses: Array.from(this.expenses.entries()),
        payments: Array.from(this.payments.entries())
      };
      require('fs').writeFileSync('./storage-backup.json', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save storage:', error);
    }
  }

  private loadFromFile() {
    try {
      if (require('fs').existsSync('./storage-backup.json')) {
        const data = JSON.parse(require('fs').readFileSync('./storage-backup.json', 'utf8'));
        
        this.users.clear();
        this.customers.clear();
        this.invoices.clear();
        this.expenses.clear();
        this.payments.clear();
        
        data.users?.forEach(([key, value]: [string, User]) => this.users.set(key, value));
        data.customers?.forEach(([key, value]: [string, Customer]) => this.customers.set(key, value));
        data.invoices?.forEach(([key, value]: [string, Invoice]) => this.invoices.set(key, value));
        data.expenses?.forEach(([key, value]: [string, Expense]) => this.expenses.set(key, value));
        data.payments?.forEach(([key, value]: [string, Payment]) => this.payments.set(key, value));
        
        console.log('Storage loaded from file - Customers:', this.customers.size);
      }
    } catch (error) {
      console.error('Failed to load storage:', error);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
    this.saveToFile(); // Save after each change
    return customer;
  }

  async updateCustomer(id: string, updateData: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...updateData };
    this.customers.set(id, updatedCustomer);
    this.saveToFile(); // Save after each change
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const result = this.customers.delete(id);
    if (result) this.saveToFile(); // Save after each change
    return result;
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
    this.saveToFile(); // Save after each change
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
    this.saveToFile(); // Save after each change
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

// Create singleton storage instance that persists across hot reloads
export const storage = global.__storage_instance__ || (global.__storage_instance__ = new MemStorage());
