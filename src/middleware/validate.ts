// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

export interface ValidationOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: ValidationOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }

      // Validate params
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Validation error",
          errors: (error as any).errors.map((err: any) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }
      next(error);
    }
  };
};

// Alternative validate function for backward compatibility that accepts Zod schemas directly
export const validate2 = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // If schema has nested structure, handle it appropriately
      if (schema._def && schema._def.shape) {
        // It's a Zod object schema, parse the entire request
        req.body = schema.parse(req.body);
      } else if (schema.body) {
        // It's a nested validation object
        if (schema.body) req.body = schema.body.parse(req.body);
        if (schema.query) req.query = schema.query.parse(req.query);
        if (schema.params) req.params = schema.params.parse(req.params);
      } else {
        // Direct schema
        req.body = schema.parse(req.body);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Validation error",
          errors: (error as any).errors.map((err: any) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }
      next(error);
    }
  };
};
