import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, viewsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const ADSENSE_THRESHOLD = 500;
const ADSENSE_REVENUE_PER_VIEW = 5;
const USER_SHARE = 0.6;

const router: IRouter = Router();

router.post("/track", async (req, res) => {
  try {
    const { username, visitorId } = req.body as { username: string; visitorId: string };

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const existing = await db
      .select()
      .from(viewsTable)
      .where(and(eq(viewsTable.userId, user.id), eq(viewsTable.visitorId, visitorId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(viewsTable).values({ userId: user.id, visitorId });

      const newViews = user.totalViews + 1;

      let adsenseIncrease = 0;
      if (user.adsenseActive && newViews > ADSENSE_THRESHOLD) {
        adsenseIncrease = Math.round(ADSENSE_REVENUE_PER_VIEW * USER_SHARE);
      }

      await db
        .update(usersTable)
        .set({
          totalViews: newViews,
          adsenseBalance: user.adsenseBalance + adsenseIncrease,
        })
        .where(eq(usersTable.id, user.id));

      res.json({
        totalViews: newViews,
        adsenseEligible: newViews >= ADSENSE_THRESHOLD,
      });
    } else {
      res.json({
        totalViews: user.totalViews,
        adsenseEligible: user.totalViews >= ADSENSE_THRESHOLD,
      });
    }
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
