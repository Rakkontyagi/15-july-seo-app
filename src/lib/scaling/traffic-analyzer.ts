
import { Request, Response, NextFunction } from 'express';

export class TrafficAnalyzer {
  private requestCounts = new Map<string, number>();

  constructor() {
    setInterval(() => {
      this.requestCounts.clear();
    }, 60000);
  }

  middleware = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip;
    const count = this.requestCounts.get(ip) || 0;
    this.requestCounts.set(ip, count + 1);

    if (count > 100) {
      return res.status(429).send('Too many requests');
    }

    next();
  };
}
