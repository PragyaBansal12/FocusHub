import express from "express";
import{
    uploadMaterial,
    getMaterials,
    getMaterial,
    downloadMaterial,
    deleteMaterial,
    getStorageStats
}from "../controllers/MaterialController.js"
import { authMiddleware} from "../middleware/authMiddleware.js";
import upload from "../config/multerConfig.js";
const router = express.Router();

//all routes require authentication
router.use(authMiddleware);

//upload materials with file handling
router.post("/",upload.single('file'),uploadMaterial);

//get all materials with optional filters
router.get("/",getMaterials);

//get storage stats
router.get("/stats",getStorageStats);

//get singlematerial
router.get("/:id",getMaterial);

//downloadmaterial
router.get("/:id/download",downloadMaterial);

//delete material
router.delete("/:id",deleteMaterial);

export default router;