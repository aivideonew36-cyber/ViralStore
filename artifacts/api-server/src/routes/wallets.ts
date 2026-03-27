import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate.js";

const ADSENSE_THRESHOLD = 500;
const ADMIN_WITHDRAWAL_FEE = 0.15;

const router: IRouter = Router();

router.get("/", authenticate, async (req: AuthenticatedRequest, res) => {
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
      salesBalance: user.salesBalance,
      adsenseBalance: user.adsenseBalance,
      totalViews: user.totalViews,
      adsenseActive: user.adsenseActive,
      adsenseThreshold: ADSENSE_THRESHOLD,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/withdraw", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { walletType, amount, mobileMoneyNumber } = req.body as {
      walletType: "sales" | "adsense";
      amount: number;
      mobileMoneyNumber: string;
    };

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId!))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const balance = walletType === "sales" ? user.salesBalance : user.adsenseBalance;

    if (amount > balance) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }

    const adminFee = Math.round(amount * ADMIN_WITHDRAWAL_FEE);
    const netAmount = amount - adminFee;

    if (walletType === "sales") {
      await db
        .update(usersTable)
        .set({ salesBalance: balance - amount })
        .where(eq(usersTable.id, req.userId!));
    } else {
      await db
        .update(usersTable)
        .set({ adsenseBalance: balance - amount })
        .where(eq(usersTable.id, req.userId!));
    }

    res.json({
      grossAmount: amount,
      adminFee,
      netAmount,
      mobileMoneyNumber,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/adsense/activate", authenticate, async (req: AuthenticatedRequest, res) => {
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

    if (user.adsenseActive) {
      res.json({ active: true, message: "AdSense déjà activé ! 🎉" });
      return;
    }

    await db
      .update(usersTable)
      .set({ adsenseActive: true })
      .where(eq(usersTable.id, req.userId!));

    res.json({
      active: true,
      message: "AdSense activé ! Tu gagneras 60% des revenus pub dès 500 vues 🚀",
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
