import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, referralsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate.js";

const ADMIN_COMMISSION = 0.15;
const PASS_PRICE = 5000;

const router: IRouter = Router();

router.get("/settings", authenticate, async (req: AuthenticatedRequest, res) => {
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
      referralCode: user.referralCode,
      passPrice: PASS_PRICE,
      bonusAmount: user.bonusAmount,
      adminCommission: ADMIN_COMMISSION * 100,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { bonusAmount } = req.body as { bonusAmount: number };

    const adminCut = Math.round(PASS_PRICE * ADMIN_COMMISSION);
    const maxBonus = PASS_PRICE - adminCut;

    if (bonusAmount < 0 || bonusAmount > maxBonus) {
      res.status(400).json({ error: `Bonus must be between 0 and ${maxBonus} FCFA` });
      return;
    }

    const [user] = await db
      .update(usersTable)
      .set({ bonusAmount })
      .where(eq(usersTable.id, req.userId!))
      .returning();

    res.json({
      referralCode: user.referralCode,
      passPrice: PASS_PRICE,
      bonusAmount: user.bonusAmount,
      adminCommission: ADMIN_COMMISSION * 100,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/join/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      referrerUsername: user.username,
      bonusAmount: user.bonusAmount,
      passPrice: PASS_PRICE,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pass/purchase", async (req, res) => {
  try {
    const { referrerUsername, buyerUserId } = req.body as {
      referrerUsername: string;
      buyerUserId: number;
    };

    const [referrer] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, referrerUsername))
      .limit(1);

    if (!referrer) {
      res.status(404).json({ error: "Referrer not found" });
      return;
    }

    const adminAmount = Math.round(PASS_PRICE * ADMIN_COMMISSION);
    const buyerBonus = referrer.bonusAmount;
    const referrerAmount = PASS_PRICE - adminAmount - buyerBonus;

    await db.insert(referralsTable).values({
      referrerId: referrer.id,
      refereeId: buyerUserId,
      bonusAmount: buyerBonus,
      status: "completed",
    });

    await db
      .update(usersTable)
      .set({ salesBalance: referrer.salesBalance + referrerAmount })
      .where(eq(usersTable.id, referrer.id));

    await db
      .update(usersTable)
      .set({ salesBalance: buyerBonus })
      .where(eq(usersTable.id, buyerUserId));

    res.json({
      success: true,
      adminAmount,
      referrerAmount,
      buyerBonus,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/list", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const referrals = await db
      .select()
      .from(referralsTable)
      .where(eq(referralsTable.referrerId, req.userId!));

    res.json(referrals);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
