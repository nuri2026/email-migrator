import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Delete in reverse order of dependencies
    await prisma.$transaction([
      prisma.brevoNote.deleteMany(),
      prisma.brevoTask.deleteMany(),
      prisma.brevoDeal.deleteMany(),
    ]);

    return NextResponse.json({ message: "All staged migration data has been wiped." });
  } catch (error) {
    console.error("Wipe error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
