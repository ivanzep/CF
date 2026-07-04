import { Request } from "express";

// mergeParams routers can't infer parent route params from their own path,
// so req.params types as {} at the sub-router's mount point. This reads the
// merged param with a known shape instead of scattering `as any` casts.
export function param(req: Request, name: string): string {
  return (req.params as Record<string, string>)[name];
}
