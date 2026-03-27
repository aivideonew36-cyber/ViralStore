import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, optionalAuth, type AuthenticatedRequest } from "../middlewares/authenticate.js";

const router: IRouter = Router();

router.get("/", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.userId, req.userId!),
          eq(productsTable.status, "active")
        )
      );

    res.json(products);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, price, actionType, actionValue, cloudinaryUrl, cloudinaryPublicId } = req.body as {
      name: string;
      price: number;
      actionType: string;
      actionValue?: string;
      cloudinaryUrl: string;
      cloudinaryPublicId: string;
    };

    if (!name || !price || !actionType || !cloudinaryUrl || !cloudinaryPublicId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [product] = await db
      .insert(productsTable)
      .values({
        userId: req.userId!,
        name,
        price,
        actionType,
        actionValue: actionValue ?? null,
        cloudinaryUrl,
        cloudinaryPublicId,
      })
      .returning();

    res.status(201).json(product);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const [product] = await db
      .select()
      .from(productsTable)
      .where(and(eq(productsTable.id, id), eq(productsTable.userId, req.userId!)))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await db
      .update(productsTable)
      .set({ status: "deleted" })
      .where(eq(productsTable.id, id));

    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shop/:username", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { username } = req.params;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Shop not found" });
      return;
    }

    const products = await db
      .select()
      .from(productsTable)
      .where(
        and(
          eq(productsTable.userId, user.id),
          eq(productsTable.status, "active")
        )
      );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        whatsappNumber: user.whatsappNumber,
        adsenseActive: user.adsenseActive,
        totalViews: user.totalViews,
        createdAt: user.createdAt,
      },
      products,
      adsenseActive: user.adsenseActive,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
