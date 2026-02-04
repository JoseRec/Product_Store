import type { Request, Response } from "express";
import * as queries from "../db/queries";
import { getAuth } from "@clerk/express";

/**
 * Synchronizes the authenticated user's record by upserting it in the database and sending an HTTP response.
 *
 * Expects `email`, `name`, and `imageUrl` in the request body. Responds with status 200 and the upserted user on success,
 * 401 if the request is not authenticated, and 400 if required fields are missing or syncing fails.
 */
export async function syncUser(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { email, name, imageUrl } = req.body;

    if (!email || !name || !imageUrl) {
      return res
        .json(400)
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
    res.json(400).json({ error: "Failed to sync user" });
  }
}