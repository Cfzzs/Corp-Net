import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: "Não autorizado" },
        { status: 401 }
      );
    }

    const { icName } = await req.json();

    if (!icName || icName.trim().length < 3) {
      return NextResponse.json(
        { message: "Nome IC inválido" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { icName: icName.trim() },
    });

    return NextResponse.json({
      message: "Nome IC atualizado com sucesso",
      user: {
        id: updatedUser.id,
        icName: updatedUser.icName,
      },
    });
  } catch (error: any) {
    console.error("Erro no onboarding API:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor", error: error.message },
      { status: 500 }
    );
  }
}
