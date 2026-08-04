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

    const infractions = await prisma.vehicleInfraction.findMany({
      where: {
        OR: [
          { proprietario: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const infByOwner = infractions.reduce((acc: any, inf: any) => {
      const key = inf.proprietario.toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(inf);
      return acc;
    }, {});

    const prisons = await prisma.prisonRecord.findMany({
      where: {
        OR: [
          { nome: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const prisonByOwner = prisons.reduce((acc: any, p: any) => {
      const key = p.nome.toLowerCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {});

    const mapMulta = (inf: any) => ({
      id: inf.id,
      placa: inf.placa,
      modelo: inf.modelo,
      cor: inf.cor,
      artigosTexto: inf.artigosTexto,
      valorTotal: inf.valorTotal,
      imagemUrl: inf.imagemUrl,
      agenteIcName: inf.agenteIcName,
      data: inf.createdAt,
    });

    const mapPrisao = (p: any) => ({
      id: p.id,
      resumo: p.resumo,
      pena: p.pena,
      multa: p.multa,
      imagemUrl: p.imagemUrl,
      agenteIcName: p.agenteIcName,
      data: p.createdAt,
    });

    const withMultas = (multas: any[]) => ({
      multas: multas.map(mapMulta),
      totalInfracoes: multas.length,
      totalMultas: multas.reduce((sum: number, i: any) => sum + i.valorTotal, 0),
    });

    const withPrisoes = (prisoes: any[]) => ({
      prisoes: prisoes.map(mapPrisao),
      totalPrisoes: prisoes.length,
    });

    const results = await Promise.all(users.map(async (user) => {
      const blacklisted = await prisma.blacklist.findFirst({
        where: { discordId: user.id },
      });

      const multas = user.icName ? (infByOwner[user.icName.toLowerCase()] || []) : [];
      const prisoes = user.icName ? (prisonByOwner[user.icName.toLowerCase()] || []) : [];

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
        ...withMultas(multas),
        ...withPrisoes(prisoes),
      };
    }));

    // Pessoas que só aparecem nas multas veiculares ou prisões (não registradas no sistema)
    const coveredNames = new Set(results.map((r: any) => r.icName?.toLowerCase()));
    const extraFromInfractions = Object.entries(infByOwner)
      .filter(([nome]) => !coveredNames.has(nome))
      .map(([nome, multas]: [string, any]) => {
        const m = multas as any[];
        const nomeOriginal = m[0].proprietario;
        coveredNames.add(nome);
        return {
          id: `inf-${nome}`,
          name: nomeOriginal,
          icName: nomeOriginal,
          status: "-",
          role: "-",
          records: [],
          advertencias: 0,
          isProcurado: false,
          blacklistReason: null,
          ...withMultas(m),
          ...withPrisoes(prisonByOwner[nome] || []),
        };
      });

    const extraFromPrisons = Object.entries(prisonByOwner)
      .filter(([nome]) => !coveredNames.has(nome))
      .map(([nome, pris]: [string, any]) => {
        const p = pris as any[];
        return {
          id: `pris-${nome}`,
          name: p[0].nome,
          icName: p[0].nome,
          status: "-",
          role: "-",
          records: [],
          advertencias: 0,
          isProcurado: false,
          blacklistReason: null,
          ...withMultas([]),
          ...withPrisoes(p),
        };
      });

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
        multas: [],
        totalInfracoes: 0,
        totalMultas: 0,
        prisoes: [],
        totalPrisoes: 0,
      }));

    return NextResponse.json({ results: [...results, ...extraFromInfractions, ...extraFromPrisons, ...blacklistResults] });
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

  return NextResponse.json({ results: [] });
}
