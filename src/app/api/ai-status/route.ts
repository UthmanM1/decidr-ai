import { NextResponse } from "next/server";
import { isAIAvailable } from "@/lib/services/ai-service";

export async function GET() {
  return NextResponse.json({ aiAvailable: isAIAvailable(), demoMode: !isAIAvailable() });
}
