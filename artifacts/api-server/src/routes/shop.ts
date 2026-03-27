import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

router.get("/:username", async (req, res) => {
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
