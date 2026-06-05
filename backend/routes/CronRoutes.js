import express from "Express"
import {res} from "../controllers/CronController.js";
const router = express.Router();
router.get('/',res);
export default router
