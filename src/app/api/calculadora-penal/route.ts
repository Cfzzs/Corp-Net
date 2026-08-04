import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const resumo = formData.get("resumo") as string;
    const nomePreso = formData.get("nomePreso") as string;
    const imagemUrl = formData.get("imagemUrl") as string;
    const agenteNome = formData.get("agenteNome") as string;
    const agenteIcName = formData.get("agenteIcName") as string;
    const pena = formData.get("pena") as string;
    const multa = formData.get("multa") as string;

    if (!resumo) {
      return NextResponse.json(
        { error: "Nenhum cálculo para enviar" },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL_CALCULADORA_PENAL || process.env.DISCORD_WEBHOOK_URL_APREENSOES;

    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL_CALCULADORA_PENAL não configurado");
      return NextResponse.json(
        { error: "Webhook do Discord não configurado" },
        { status: 500 }
      );
    }

    const embedPayload: any = {
      content: "<@&1341103708519403522>",
      embeds: [
        {
          title: "⚖️ CÁLCULO PENAL - PRS",
          color: 15158332,
          fields: [
            {
              name: "👮 Agente Responsável",
              value: `${agenteIcName || "N/A"} (@${agenteNome})`,
              inline: true
            },
            {
              name: "🚔 Preso",
              value: nomePreso || "Não informado",
              inline: true
            },
            {
              name: "⏳ Pena",
              value: pena || "—",
              inline: true
            },
            {
              name: "💰 Multa",
              value: `R$ ${multa || "0"}`,
              inline: true
            },
            {
              name: "📋 Cálculo",
              value: resumo.substring(0, 1000),
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

    return NextResponse.json(
      { success: true, message: "Cálculo enviado com sucesso" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao processar envio do cálculo penal:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar envio" },
      { status: 500 }
    );
  }
}
