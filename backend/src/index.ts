import express from "express";
import cors from "cors";
import { ENV } from "./config/env";
import { clerkMiddleware } from "@clerk/express";

const app = express();

//Middleware
app.use(cors({ origin: ENV.FRONTEND_URL }));
app.use(clerkMiddleware()); // Authentication (req.auth)
app.use(express.json()); // parses JSON request bodies
app.use(express.urlencoded({ extended: true })); // parses form data (like HTML form)

app.get("/", (req, res) => {
  res.json({
    message:
      "Welcome to the Store API — built with PostgreSQL, Drizzle ORM, and Clerk Authentication.",
    endpoints: {
      users: "/api/users",
      prooducts: "/api/products",
      comments: "/api/comments",
    },
  });
});

app.listen(ENV.PORT, () =>
  console.log(`Servidor corriendo en el puerto: ${ENV.PORT}`),
);
