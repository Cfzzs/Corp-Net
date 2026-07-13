import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando semeadura do banco de dados...");

  // ── 0. PERFIL DO DESENVOLVEDOR (Discord ID real) ─────────────────────────
  // Upsert garante que o perfil é criado OU atualizado se já existir
  await prisma.user.upsert({
    where: { id: "1210316260319961122" },
    update: {
      role: "DEV",
      status: "ATIVO",
      icName: "Dominic Camargo",
      rank: "Agente Especial",
      probationEnd: null,
    },
    create: {
      id: "1210316260319961122",
      name: "ice_luyw",
      email: "dominic@corpnet.internal",
      image: "https://api.dicebear.com/7.x/bottts/svg?seed=Dominic",
      role: "DEV",
      status: "ATIVO",
      icName: "Dominic Camargo",
      rank: "Agente Especial",
      probationEnd: null,
    },
  });
  console.log("✅ Perfil DEV criado/atualizado.");

  // ── 1. Limpa dados mock anteriores (preserva o perfil DEV) ───────────────
  await prisma.record.deleteMany({});
  await prisma.blacklist.deleteMany({});
  await prisma.user.deleteMany({
    where: { id: { not: "1210316260319961122" } },
  });

  // 2. Criar usuários mock
  
  // Silva - Membro em Período de Teste com 15 dias de duração
  const silva = await prisma.user.create({
    data: {
      id: "1001",
      name: "Silva Mock",
      icName: "Silva_IC",
      email: "silvamock@mock.com",
      image: "https://api.dicebear.com/7.x/bottts/svg?seed=Silva",
      role: "MEMBRO",
      status: "EM_TESTE",
      probationEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias de teste
    },
  });

  // Oliveira - Sargento / Líder
  const oliveira = await prisma.user.create({
    data: {
      id: "1002",
      name: "Oliveira Mock",
      icName: "Oliveira_IC",
      email: "oliveiramock@mock.com",
      image: "https://api.dicebear.com/7.x/bottts/svg?seed=Oliveira",
      role: "LIDER",
      status: "ATIVO",
    },
  });

  // Souza - Coronel / Alto Comando / Admin
  const souza = await prisma.user.create({
    data: {
      id: "1003",
      name: "Souza Mock",
      icName: "Souza_IC",
      email: "souzamock@mock.com",
      image: "https://api.dicebear.com/7.x/bottts/svg?seed=Souza",
      role: "ADMIN",
      status: "ATIVO",
    },
  });

  // Santos - Outro recruta em teste com 3 dias restantes (próximo do fim)
  const santos = await prisma.user.create({
    data: {
      id: "1005",
      name: "Santos Mock",
      icName: "Santos_IC",
      email: "santosmock@mock.com",
      image: "https://api.dicebear.com/7.x/bottts/svg?seed=Santos",
      role: "MEMBRO",
      status: "EM_TESTE",
      probationEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Almeida - Recruta acumulando 3/3 advertências (para teste crítico de demissão)
  const almeida = await prisma.user.create({
    data: {
      id: "1006",
      name: "Almeida Mock",
      icName: "Almeida_IC",
      email: "almeidamock@mock.com",
      image: "https://api.dicebear.com/7.x/bottts/svg?seed=Almeida",
      role: "MEMBRO",
      status: "EM_TESTE",
      probationEnd: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  // 2. Criar registros e avaliações (Records)
  
  // Elogio de desempenho para Silva feito por Oliveira
  await prisma.record.create({
    data: {
      type: "ELOGIO",
      description: "Demonstrou excelente conduta tática e disciplina operacional no acompanhamento de patrulhas noturnas na data de ontem.",
      proofUrl: "https://imgur.com/gallery/prova-elogio",
      userId: silva.id,
      createdById: oliveira.id,
    },
  });

  // Advertência Leve para Silva feita por Oliveira (1/3)
  await prisma.record.create({
    data: {
      type: "ADVERTENCIA_LEVE",
      description: "Falta de rádio comunicador ativo na frequência obrigatória e fardamento desajustado durante formatura matinal.",
      proofUrl: "https://youtube.com/watch?v=prova-leve",
      userId: silva.id,
      createdById: oliveira.id,
    },
  });

  // Advertência Grave para Silva feita por Souza (2/3)
  await prisma.record.create({
    data: {
      type: "ADVERTENCIA_GRAVE",
      description: "Engajamento em tiroteio sem autorização do oficial de dia e invasão de zona quente sob ordens de recuo.",
      proofUrl: "https://medal.tv/clips/prova-grave",
      userId: silva.id,
      createdById: souza.id,
    },
  });

  // Observação para Santos feita por Oliveira
  await prisma.record.create({
    data: {
      type: "OBSERVACAO",
      description: "Recruta demonstra facilidade na condução de viaturas táticas rápidas, mas precisa praticar a verbalização operacional.",
      userId: santos.id,
      createdById: oliveira.id,
    },
  });

  // 3 Advertências acumuladas para Almeida (3/3)
  await prisma.record.create({
    data: {
      type: "ADVERTENCIA_LEVE",
      description: "Atraso no início do plantão de patrulhamento tático rodoviário.",
      userId: almeida.id,
      createdById: oliveira.id,
    },
  });

  await prisma.record.create({
    data: {
      type: "ADVERTENCIA_LEVE",
      description: "Danos materiais excessivos em viatura oficial por direção imprudente in-character.",
      userId: almeida.id,
      createdById: oliveira.id,
    },
  });

  await prisma.record.create({
    data: {
      type: "ADVERTENCIA_GRAVE",
      description: "Verbalização ofensiva e desnecessária contra civis abordados em fiscalização ordinária.",
      proofUrl: "https://youtube.com/watch?v=abuso-almeida",
      userId: almeida.id,
      createdById: souza.id,
    },
  });

  // 3. Criar registros da Blacklist (Banece)
  
  await prisma.blacklist.create({
    data: {
      discordId: "999111222333",
      icName: "Gabriel_Banned",
      reason: "Flagrado desviando recursos bélicos e armamentos leves do cofre da corporação para comercialização externa.",
      proofUrl: "https://imgur.com/gallery/desvio-armas",
      createdById: souza.id,
    },
  });

  await prisma.blacklist.create({
    data: {
      discordId: "888222333444",
      icName: "Jefferson_Corrupt",
      reason: "Facilitação de fuga de suspeitos sob custódia e recebimento in-character de valores ilícitos (suborno).",
      proofUrl: "https://medal.tv/clips/corrupcao-jefferson",
      createdById: souza.id,
    },
  });

  console.log("Banco de dados local preenchido com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro ao rodar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
