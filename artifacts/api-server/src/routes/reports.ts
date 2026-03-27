import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { productsTable, reportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const REPORT_THRESHOLD = 5;

const router: IRouter = Router();

router.post("/", async (req, res) => {
  try {
    const { productId, reason } = req.body as { productId: number; reason: string };

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .limit(1);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    await db.insert(reportsTable).values({ productId, reason });

    const newReportCount = product.reportCount + 1;
    const newStatus = newReportCount >= REPORT_THRESHOLD ? "under_review" : product.status;

    await db
      .update(productsTable)
      .set({ reportCount: newReportCount, status: newStatus })
      .where(eq(productsTable.id, productId));

    res.json({ reportCount: newReportCount, status: newStatus });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
