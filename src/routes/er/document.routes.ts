// server/src/routes/document.routes.ts
import { Router } from "express";
import {
  getAllDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../../controllers/er/document.controller";

const router = Router();
router.get("/", getAllDocuments);
router.get("/:id", getDocumentById);
router.post("/", createDocument);
router.patch("/:id", updateDocument);
router.delete("/:id", deleteDocument);
export default router;
