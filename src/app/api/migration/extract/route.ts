import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { BrevoExtractionService } from "@/services/migration/brevo-extraction-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.apiConfiguration.findUnique({
      where: { userId: session.user.id },
    });

    if (!config?.brevoApiKey) {
      return NextResponse.json({ message: "Brevo API Key not configured" }, { status: 400 });
    }

    const service = new BrevoExtractionService(config.brevoApiKey, session.user.id);
    await service.extractAll();

    return NextResponse.json({ message: "Extraction completed successfully" });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
