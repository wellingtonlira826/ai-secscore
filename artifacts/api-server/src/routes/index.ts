import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import frameworksRouter from "./frameworks";
import assessmentsRouter from "./assessments";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(frameworksRouter);
router.use(assessmentsRouter);
router.use(dashboardRouter);

export default router;
