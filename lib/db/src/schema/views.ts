import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const viewsTable = pgTable("views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  visitorId: text("visitor_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertViewSchema = createInsertSchema(viewsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertView = z.infer<typeof insertViewSchema>;
export type View = typeof viewsTable.$inferSelect;
