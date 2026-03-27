import { pgTable, text, serial, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  whatsappNumber: text("whatsapp_number"),
  adsenseActive: boolean("adsense_active").notNull().default(false),
  totalViews: integer("total_views").notNull().default(0),
  salesBalance: integer("sales_balance").notNull().default(0),
  adsenseBalance: integer("adsense_balance").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  bonusAmount: integer("bonus_amount").notNull().default(1000),
  passPrice: integer("pass_price").notNull().default(5000),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  totalViews: true,
  salesBalance: true,
  adsenseBalance: true,
  adsenseActive: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
