import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { domainsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthenticatedRequest } from "../middlewares/authenticate.js";

const DOMAIN_PRICE = 6500;

const router: IRouter = Router();

router.post("/check", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { domain } = req.body as { domain: string };

    const existing = await db
      .select()
      .from(domainsTable)
      .where(eq(domainsTable.domain, domain))
      .limit(1);

    res.json({
      available: existing.length === 0,
      domain,
      price: DOMAIN_PRICE,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/purchase", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const { domain, mobileMoneyNumber } = req.body as {
      domain: string;
      mobileMoneyNumber: string;
    };

    const existing = await db
      .select()
      .from(domainsTable)
      .where(eq(domainsTable.domain, domain))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: "Domain already taken" });
      return;
    }

    await db.insert(domainsTable).values({
      userId: req.userId!,
      domain,
    });

    res.json({
      success: true,
      domain,
      message: `Domaine ${domain} activé ! Paiement de ${DOMAIN_PRICE} FCFA via ${mobileMoneyNumber} ✅`,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/list", authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const domains = await db
      .select()
      .from(domainsTable)
      .where(eq(domainsTable.userId, req.userId!));

    res.json(domains);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
