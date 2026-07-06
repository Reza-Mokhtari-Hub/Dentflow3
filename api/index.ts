import { createExpressApp } from "../dist/server.cjs";

let appPromise: any = null;

export default async function handler(req: any, res: any) {
  // Allow CORS for flexibility
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!appPromise) {
    appPromise = createExpressApp();
  }
  
  try {
    const app = await appPromise;
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Handler Error:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err?.message || err });
  }
}
