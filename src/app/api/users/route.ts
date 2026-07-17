import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query || "" } },
          { icName: { contains: query || "" } },
        ],
        status: { in: ["ATIVO", "EM_TESTE"] },
      },
      select: {
        id: true,
        name: true,
        icName: true,
        role: true,
      },
      orderBy: { name: "asc" },
      take: 20,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }
}
