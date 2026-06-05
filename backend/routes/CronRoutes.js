import express from "express"
import {res} from "../controllers/CronController.js";
const router = express.Router();
router.get('/',res);
export default router
