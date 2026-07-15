import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import frameworksRouter from "./frameworks";
import assessmentsRouter from "./assessments";
import dashboardRouter from "./dashboard";
import evidenceRouter from "./evidence";
import storageRouter from "./storage";
import remediationRouter from "./remediation";
import collaboratorsRouter from "./collaborators";
import complianceRouter from "./compliance";
import corporateRouter from "./corporate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(frameworksRouter);
router.use(assessmentsRouter);
router.use(dashboardRouter);
router.use(evidenceRouter);
router.use(storageRouter);
router.use(remediationRouter);
router.use(collaboratorsRouter);
router.use(complianceRouter);
router.use(corporateRouter);

export default router;
