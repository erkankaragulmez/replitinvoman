import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
});

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  description: text("description"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paid: boolean("paid").default(false),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  label: text("label").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Expense = typeof expenses.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
