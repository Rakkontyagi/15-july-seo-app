
import { Request, Response, NextFunction } from 'express';
import { AutoScaler } from './auto-scaler';
import { TrafficAnalyzer } from './traffic-analyzer';

const autoScaler = new AutoScaler();
const trafficAnalyzer = new TrafficAnalyzer();

export function scalingMiddleware(req: Request, res: Response, next: NextFunction) {
  trafficAnalyzer.middleware(req, res, next);
}
