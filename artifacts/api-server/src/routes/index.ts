import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import shopRouter from "./shop.js";
import walletsRouter from "./wallets.js";
import referralsRouter from "./referrals.js";
import viewsRouter from "./views.js";
import reportsRouter from "./reports.js";
import domainsRouter from "./domains.js";
import openrouterRouter from "./openrouter.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/shop", shopRouter);
router.use("/wallets", walletsRouter);
router.use("/adsense", walletsRouter);
router.use("/referrals", referralsRouter);
router.use("/views", viewsRouter);
router.use("/reports", reportsRouter);
router.use("/domains", domainsRouter);
router.use("/openrouter", openrouterRouter);

export default router;
