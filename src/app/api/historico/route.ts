import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") || "pessoa";
  const q = searchParams.get("q") || "";

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (tipo === "pessoa") {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { icName: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        recordsReceived: {
          orderBy: { date: "desc" },
          take: 50,
        },
      },
    });

    const blacklist = await prisma.blacklist.findMany({
      where: {
        OR: [
          { icName: { contains: q, mode: "insensitive" } },
        ],
      },
    });

    const results = await Promise.all(users.map(async (user) => {
      const blacklisted = await prisma.blacklist.findFirst({
        where: { discordId: user.id },
      });

      return {
        id: user.id,
        name: user.name,
        icName: user.icName,
        status: user.status,
        role: user.role,
        records: user.recordsReceived.map(r => ({
          id: r.id,
          type: r.type,
          description: r.description,
          date: r.date,
        })),
        advertencias: user.recordsReceived.filter(r => r.type === "ADVERTENCIA_LEVE" || r.type === "ADVERTENCIA_GRAVE").length,
        isProcurado: !!blacklisted,
        blacklistReason: blacklisted?.reason || null,
      };
    }));

    const blacklistResults = blacklist
      .filter(b => !results.find(r => r.id === b.discordId))
      .map(b => ({
        id: b.discordId,
        icName: b.icName,
        name: b.discordId,
        status: "BANIDO",
        role: "-",
        records: [],
        advertencias: 0,
        isProcurado: true,
        blacklistReason: b.reason,
      }));

    return NextResponse.json({ results: [...results, ...blacklistResults] });
  }

  if (tipo === "veiculo") {
    const infractions = await prisma.vehicleInfraction.findMany({
      where: {
        OR: [
          { proprietario: { contains: q, mode: "insensitive" } },
          { modelo: { contains: q, mode: "insensitive" } },
          { placa: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const grouped = infractions.reduce((acc: any, inf: any) => {
      const key = inf.proprietario;
      if (!acc[key]) acc[key] = [];
      acc[key].push(inf);
      return acc;
    }, {});

    const results = Object.entries(grouped).map(([proprietario, infs]: [string, any]) => {
      const totalMultas = (infs as any[]).reduce((sum: number, i: any) => sum + i.valorTotal, 0);
      return {
        proprietario,
        infractions: (infs as any[]).map((i: any) => ({
          id: i.id,
          placa: i.placa,
          modelo: i.modelo,
          cor: i.cor,
          artigosTexto: i.artigosTexto,
          valorTotal: i.valorTotal,
          imagemUrl: i.imagemUrl,
          agenteIcName: i.agenteIcName,
          data: i.createdAt,
        })),
        totalInfracoes: (infs as any[]).length,
        totalMultas,
      };
    });

    return NextResponse.json({ results });
  }

  if (tipo === "preso") {
    const prisoners = await prisma.prisoner.findMany({
      where: {
        OR: [
          { nome: { contains: q, mode: "insensitive" } },
          { motivo: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const grouped = prisoners.reduce((acc: any, p: any) => {
      const key = p.nome;
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    const results = Object.entries(grouped).map(([nome, pris]: [string, any]) => ({
      nome,
      prisões: (pris as any[]).map((p: any) => ({
        id: p.id,
        motivo: p.motivo,
        observacoes: p.observacoes,
        imagemUrl: p.imagemUrl,
        agenteIcName: p.agenteIcName,
        data: p.createdAt,
      })),
      totalPrisoes: (pris as any[]).length,
    }));

    return NextResponse.json({ results });
  }

  return NextResponse.json({ results: [] });
}
