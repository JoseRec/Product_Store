import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { One, relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updateAt: timestamp("update_at", { mode: "date" }).notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updateAt: timestamp("update_at", { mode: "date" }).notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// Users Relations: A user can have many products and comments but everyone of this only can have one user
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  comments: many(comments),
}));

// Products Relations: A product belongs to one user
export const productsRelations = relations(products, ({ one, many }) => ({
  comments: many(comments),
  users: one(users, { fields: [products.userId], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  // field = the foreing key column in the table
  // references = this primary key column in the related table
  users: one(users, { fields: [comments.userId], references: [users.id] }),
  products: one(products, {
    fields: [comments.productId],
    references: [products.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;


export type Product = typeof products.$inferSelect;
export type NewProduc = typeof products.$inferInsert;


export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
