import { desc, eq } from "drizzle-orm";
import { db } from "./index";
import {
  users,
  products,
  comments,
  type NewUser,
  type NewProduct,
  type NewComment,
} from "./schema";

// User Queries
export const createUser = async (data: NewUser) => {
  const [user] = await db.insert(users).values(data).returning();
  return user;
};

export const getUserById = async (id: string) => {
  return db.query.users.findFirst({ where: eq(users.id, id) });
};

export const updateUser = async (id: string, data: Partial<NewUser>) => {
  const [user] = await db
    .update(users)
    .set(data)
    .where(eq(users.id, id))
    .returning();
  return user;
};

// upsert ->create or update
export const upsertUser = async (data: NewUser) => {
  const existignUser = await getUserById(data.id);
  if (existignUser) return updateUser(data.id, data);

  return createUser(data);
};

// Product Queries
export const createProduct = async (data: NewProduct) => {
  const [product] = await db.insert(products).values(data).returning();
  return product;
};

export const getAllProducts = async () => {
  return db.query.products.findMany({
    with: { users: true }, // -> Join
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
};

export const getProductById = async (id: string) => {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    // "with" enables eager loading (JOINs) based on relations defined in schema.ts
    with: {
      // Includes the user who owns the product
      // JOIN users ON users.id = products.user_id
      users: true,
      // Includes all comments related to this product
      // JOIN comments ON comments.product_id = products.id
      comments: {
        // For each comment, also include the user who wrote it
        // JOIN users ON users.id = comments.user_id
        with: { users: true },
        // Orders comments by creation date (newest first)
        // ORDER BY comments.created_at DESC
        orderBy: (comments, { desc }) => [desc(comments.createdAt)],
      },
    },
  });
};

export const getProductsByUserId = async (userId: string) => {
  return db.query.products.findMany({
    where: eq(products.userId, userId),
    with: { users: true },
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
};

export const updateProduct = async (id: string, data: Partial<NewProduct>) => {
  const [product] = await db
    .update(products)
    .set(data)
    .where(eq(products.id, id))
    .returning();

  return product;
};

export const deleteProduct = async (id: string) => {
  const [product] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning();

  return product;
};

// Comments Queries
export const createComment = async (data: NewComment) => {
  const [comment] = await db.insert(comments).values(data).returning();
  return comment;
};

export const deleteComment = async (id: string) => {
  const [comment] = await db
    .delete(comments)
    .where(eq(comments.id, id))
    .returning();
  return comment;
};

export const getCommentById = async (id: string) => {
  return db.query.comments.findFirst({
    where: eq(comments.id, id),
    with: { users: true },
  });
};
