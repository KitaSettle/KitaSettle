import { NextResponse } from "next/server";
import { env, getDataMode } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (env.isProduction) {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }

  const dataMode = getDataMode();

  return NextResponse.json({
    status: "ok",
    service: env.appName,
    environment: env.appEnv,
    dataMode,
    timestamp: new Date().toISOString(),
  });
}
