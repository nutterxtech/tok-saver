import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import downloadRouter from "./download";
import subscriptionRouter from "./subscription";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(downloadRouter);
router.use(subscriptionRouter);
router.use(adminRouter);

export default router;
