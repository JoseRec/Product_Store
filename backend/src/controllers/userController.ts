import type { Request, Response } from "express";
import * as queries from "../db/queries";
import { getAuth } from "@clerk/express";

/**
 * Synchronizes the authenticated user's profile in the database.
 *
 * Validates authentication and required body fields (`email`, `name`, `imageUrl`), upserts the user record, and sends the resulting user or an appropriate error response.
 *
 * @param req - Express request whose body must include `email`, `name`, and `imageUrl`; authentication is derived from the request via `getAuth`.
 * @param res - Express response used to send the created/updated user (200) or error responses (401, 400).
 */
export async function syncUser(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { email, name, imageUrl } = req.body;

    if (!email || !name || !imageUrl) {
      return res
        .status(400)
        .json({ error: "Email,name and imageUrl are required" });
    }

    const user = await queries.upsertUser({
      id: userId,
      email,
      name,
      imageUrl,
    });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error syncing user: ", error);
    res.status(400).json({ error: "Failed to sync user" });
  }
}