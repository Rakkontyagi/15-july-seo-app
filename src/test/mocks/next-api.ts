import { NextRequest, NextResponse } from 'next/server';

// Mock Next.js Request and Response objects for API routes
export const mockRequest = (options: any) => {
  const req = new NextRequest(new Request(options.url || 'http://localhost', {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body ? JSON.stringify(options.body) : undefined,
  }));
  return req;
};

export const mockResponse = () => {
  const res = new NextResponse();
  return res;
};
