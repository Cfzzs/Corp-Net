import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

const ARTIGOS = [
  { id: "art_175", descricao: "Art. 175 - Apreensão de Veículo", valor: 500 },
  { id: "art_176", descricao: "Art. 176 - Veículo em Condições Irregulares", valor: 750 },
  { id: "art_177", descricao: "Art. 177 - Documentação Irregular", valor: 300 },
  { id: "art_178", descricao: "Art. 178 - Excesso de Velocidade", valor: 400 },
  { id: "art_179", descricao: "Art. 179 - Infração de Trânsito Grave", valor: 1000 },
  { id: "art_180", descricao: "Art. 180 - Resistência à Apreensão", valor: 1500 },
  { id: "art_181", descricao: "Art. 181 - Veículo Furtado/Robado", valor: 2000 },
  { id: "art_182", descricao: "Art. 182 - Modificação Ilegal", valor: 600 },
  { id: "art_183", descricao: "Art. 183 - Uso de Placa Ilegal", valor: 800 },
  { id: "art_184", descricao: "Art. 184 - Embriaguez ao Volante", valor: 1200 },
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
