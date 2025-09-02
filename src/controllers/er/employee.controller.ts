// server/src/controllers/employee.controller.ts
import { Request, Response } from 'express';
import { Employee } from '../../models/er/employee.model';

export const getAllEmployees = async (req: Request, res: Response) => {
  const list = await Employee.find();
  res.json(list);
};

export const createEmployee = async (req: Request, res: Response) => {
  const emp = new Employee(req.body);
  await emp.save();
  res.status(201).json(emp);
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const emp = await Employee.findByIdAndUpdate(id, req.body, { new: true });
  res.json(emp);
};

export const deleteEmployee = async (req: Request, res: Response) => {
  await Employee.findByIdAndDelete(req.params.id);
  res.status(204).send();
};