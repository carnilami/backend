import { NextFunction, Request, Response } from "express";

const auth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(403).send("Unauthorized.");
    return;
  }
  next();
};

export default auth;
