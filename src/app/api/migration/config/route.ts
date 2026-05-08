import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

    return NextResponse.json(config || {});
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { brevoApiKey, hubspotToken } = body;

    const config = await prisma.apiConfiguration.upsert({
      where: { userId: session.user.id },
      update: {
        brevoApiKey,
        hubspotToken,
      },
      create: {
        userId: session.user.id,
        brevoApiKey,
        hubspotToken,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
