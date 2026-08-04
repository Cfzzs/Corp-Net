import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const nome = formData.get("nome") as string;
    const motivo = formData.get("motivo") as string;
    const imagemUrl = formData.get("imagemUrl") as string;
    const observacoes = formData.get("observacoes") as string;
    const agenteId = formData.get("agenteId") as string;
    const agenteNome = formData.get("agenteNome") as string;
    const agenteIcName = formData.get("agenteIcName") as string;

    if (!nome || !motivo) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL_PRISOES || process.env.DISCORD_WEBHOOK_URL_APREENSOES;

    if (!webhookUrl) {
      console.error("Webhook do Discord não configurado");
      return NextResponse.json(
        { error: "Webhook do Discord não configurado" },
        { status: 500 }
      );
    }

    const embedPayload: any = {
      content: "<@&1341103708519403522>",
      embeds: [
        {
          title: "⛓️ REGISTRO DE PRISÃO - PRS",
          color: 15158332,
          fields: [
            {
              name: "👮 Agente Responsável",
              value: `${agenteIcName || "N/A"} (@${agenteNome})`,
              inline: true
            },
            {
              name: "🚔 Detido",
              value: nome,
              inline: true
            },
            {
              name: "⚖️ Motivo da Prisão",
              value: motivo,
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
      await prisma.prisoner.create({
        data: {
          nome,
          motivo,
          imagemUrl: imagemUrl || null,
          observacoes: observacoes || null,
          agenteId,
          agenteNome,
          agenteIcName,
        },
      });

      // Criar passagem criminal para o detido se ele existir no sistema
      if (nome) {
        const citizen = await prisma.user.findFirst({
          where: { icName: { equals: nome, mode: "insensitive" } },
        });
        if (citizen) {
          await prisma.record.create({
            data: {
              type: "PRISAO",
              description: `Detido em prisão - Motivo: ${motivo}${observacoes ? ` | Obs: ${observacoes}` : ""}`.substring(0, 500),
              userId: citizen.id,
              createdById: agenteId,
            },
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          action: "ADD_PRESO",
          details: `Registro de prisão - Detido: ${nome}. Motivo: ${motivo}.`,
          executorId: agenteId,
        },
      });
    } catch (logError) {
      console.error("Erro ao criar registros internos:", logError);
    }

    return NextResponse.json(
      { success: true, message: "Registro enviado com sucesso" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao processar registro de prisão:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar registro" },
      { status: 500 }
    );
  }
}
