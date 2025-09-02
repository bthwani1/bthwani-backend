// server/src/controllers/document.controller.ts
import { Request, Response } from "express";
import { Documentes as Doc } from "../../models/er/document.model";

export const getAllDocuments = async (req: Request, res: Response) => {
  const list = await Doc.find();
  res.json(list);
};

export const getDocumentById = async (req: Request, res: Response) => {
  const doc = await Doc.findById(req.params.id).populate("asset");
  res.json(doc);
};

export const createDocument = async (req: Request, res: Response) => {
  const doc = new Doc(req.body);
  await doc.save();
  res.status(201).json(doc);
};

export const updateDocument = async (req: Request, res: Response) => {
  const updated = await Doc.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(updated);
};

export const deleteDocument = async (req: Request, res: Response) => {
  await Doc.findByIdAndDelete(req.params.id);
  res.status(204).send();
};
