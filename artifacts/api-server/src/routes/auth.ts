import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  generateToken,
  storeToken,
  generateReferralCode,
} from "../lib/auth.js";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate.js";

const router: IRouter = Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, referredBy } = req.body as {
      username: string;
      email: string;
      password: string;
      referredBy?: string;
    };

    if (!username || !email || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const existingUsername = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    const passwordHash = hashPassword(password);
    const referralCode = generateReferralCode(username);

    const [user] = await db
      .insert(usersTable)
      .values({
        username,
        email,
        passwordHash,
        referralCode,
        referredBy: referredBy ?? null,
      })
      .returning();

    const token = generateToken(user.id);
    storeToken(token, user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        adsenseActive: user.adsenseActive,
        totalViews: user.totalViews,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken(user.id);
    storeToken(token, user.id);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        adsenseActive: user.adsenseActive,
        totalViews: user.totalViews,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      whatsappNumber: user.whatsappNumber,
      adsenseActive: user.adsenseActive,
      totalViews: user.totalViews,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me/whatsapp", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { whatsappNumber } = req.body as { whatsappNumber: string };

    const [user] = await db
      .update(usersTable)
      .set({ whatsappNumber })
      .where(eq(usersTable.id, req.userId!))
      .returning();

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      whatsappNumber: user.whatsappNumber,
      adsenseActive: user.adsenseActive,
      totalViews: user.totalViews,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
