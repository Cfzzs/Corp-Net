import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const ARTIGOS = [
  { id: "art_39", descricao: "Art. 39º - Condução Imprudente", valor: 10000 },
  { id: "art_40", descricao: "Art. 40º - Veículo Gravemente Avariado", valor: 10000 },
  { id: "art_41", descricao: "Art. 41º - Abandono de Veículo", valor: 5000 },
  { id: "art_42", descricao: "Art. 42º - Crime Contra o Patrimônio Público", valor: 10000 },
  { id: "art_43", descricao: "Art. 43º - Promover Corridas Ilegais", valor: 10000 },
  { id: "art_44", descricao: "Art. 44º - Conduzir Sem Capacete", valor: 10000 },
  { id: "art_45", descricao: "Art. 45º - Conduzir Veículo Sem Documento Obrigatório", valor: 50000 },
  { id: "art_46", descricao: "Art. 46º - Conduzir Sem Habilitação", valor: 15000 },
  { id: "art_47", descricao: "Art. 47º - Desobedecer Ordem de Parada", valor: 30000 },
  { id: "art_48", descricao: "Art. 48º - Incitar Acompanhamento", valor: 10000 },
  { id: "art_49", descricao: "Art. 49º - Conduzir Veículo na Contra Mão", valor: 15000 },
  { id: "art_50", descricao: "Art. 50º - Poluição Sonora Automotiva", valor: 5000 },
  { id: "art_51", descricao: "Art. 51º - Alteração de Característica", valor: 30000 },
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const imagemUrl = formData.get("imagemUrl") as string;
    const proprietario = formData.get("proprietario") as string;
    const modelo = formData.get("modelo") as string;
    const cor = formData.get("cor") as string;
    const artigosSelecionados = formData.get("artigos") as string;
    const observacoes = formData.get("observacoes") as string;
    const agenteId = formData.get("agenteId") as string;
    const agenteNome = formData.get("agenteNome") as string;
    const agenteIcName = formData.get("agenteIcName") as string;

    if (!proprietario || !artigosSelecionados) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    let artigos: string[] = [];
    try {
      artigos = JSON.parse(artigosSelecionados || "[]");
    } catch {
      artigos = [];
    }

    if (artigos.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um artigo" },
        { status: 400 }
      );
    }

    const artigosComValor = ARTIGOS.filter(a => artigos.includes(a.id));
    const valorTotal = artigosComValor.reduce((sum, a) => sum + a.valor, 0);
    const artigosTexto = artigosComValor.map(a => `${a.descricao} - R$${a.valor.toLocaleString('pt-BR')}`).join("\n");

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL_APREENSOES_VEICULAR || process.env.DISCORD_WEBHOOK_URL_APREENSOES;

    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL_APREENSOES_VEICULAR não configurado");
      return NextResponse.json(
        { error: "Webhook do Discord não configurado" },
        { status: 500 }
      );
    }

    const embedPayload: any = {
      content: "<@&1341103708519403522>",
      embeds: [
        {
          title: "🚗 REGISTRO DE APREENSÃO VEICULAR - PRS",
          color: 16753920,
          fields: [
            {
              name: "👮 Agente Responsável",
              value: `${agenteIcName || "N/A"} (@${agenteNome})`,
              inline: true
            },
            {
              name: "👤 Proprietário",
              value: proprietario,
              inline: true
            },
            {
              name: "🚗 Modelo",
              value: modelo || "Não informado",
              inline: true
            },
            {
              name: "🎨 Cor",
              value: cor || "Não informada",
              inline: true
            },
            {
              name: "⚖️ Artigos Aplicados",
              value: artigosTexto,
              inline: false
            },
            {
              name: "💰 VALOR TOTAL",
              value: `R$ ${valorTotal.toLocaleString('pt-BR')}`,
              inline: false
            }
          ],
          footer: {
            text: "PRS - Polícia Rodoviária Street. Disciplina, compromisso e excelência no patrulhamento.",
            icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
          },
          timestamp: new Date().toISOString(),
        }
      ]
    };

    if (observacoes) {
      embedPayload.embeds[0].fields.push({
        name: "📝 Observações",
        value: observacoes.substring(0, 1000),
        inline: false
      });
    }

    if (imagemUrl) {
      embedPayload.embeds[0].image = { url: imagemUrl };
    }

    const discordResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(embedPayload),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Erro ao enviar para Discord:", errorText);
      return NextResponse.json(
        { error: "Erro ao enviar notificação para Discord" },
        { status: 500 }
      );
    }

    try {
      const artigosDetalhes = artigosComValor.map(a => a.descricao).join(", ");
      await prisma.auditLog.create({
        data: {
          action: "ADD_APREENSAO_VEICULAR",
          details: `Apreensão veicular - Proprietário: ${proprietario}. Modelo: ${modelo || "N/A"}. Artigos: ${artigosDetalhes}. Valor Total: R$${valorTotal.toLocaleString('pt-BR')}.`,
          executorId: agenteId,
        },
      });
    } catch (logError) {
      console.error("Erro ao criar log de auditoria:", logError);
    }

    return NextResponse.json(
      { success: true, message: "Registro enviado com sucesso", valorTotal },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao processar apreensão veicular:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar registro" },
      { status: 500 }
    );
  }
}
