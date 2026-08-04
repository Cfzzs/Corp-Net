import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

async function enviarDiscord(
  webhookUrl: string,
  embed: any,
  imagemUrl?: string
): Promise<{ ok: boolean; text: string }> {
  // Tenta baixar a imagem no servidor e enviar anexada ao webhook.
  // Isso resolve links do cdn.discordapp.com que o proxy do Discord recusa embutir.
  if (imagemUrl) {
    try {
      const imageRes = await fetch(imagemUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (imageRes.ok) {
        const contentType = imageRes.headers.get("content-type") || "";
        if (contentType.startsWith("image/")) {
          const buffer = Buffer.from(await imageRes.arrayBuffer());
          const ext = contentType.split("/")[1]?.split(";")[0] || "png";

          const form = new FormData();
          form.append(
            "payload_json",
            JSON.stringify({
              content: embed.content,
              embeds: [
                {
                  ...embed.embeds[0],
                  image: { url: `attachment://foto.${ext}` },
                },
              ],
            })
          );
          form.append("files[0]", new Blob([buffer], { type: contentType }), `foto.${ext}`);

          const res = await fetch(webhookUrl, {
            method: "POST",
            body: form,
          });
          if (res.ok) return { ok: true, text: await res.text().catch(() => "") };
        }
      }
    } catch (error) {
      console.error("Falha ao baixar imagem, usando fallback:", error);
    }
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(embed),
  });

  return { ok: res.ok, text: await res.text().catch(() => "") };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const resumo = formData.get("resumo") as string;
    const nomePreso = formData.get("nomePreso") as string;
    const imagemUrl = formData.get("imagemUrl") as string;
    const agenteId = formData.get("agenteId") as string;
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
          image: imagemUrl ? { url: imagemUrl } : undefined,
        }
      ]
    };

    const discordResponse = await enviarDiscord(webhookUrl, embedPayload, imagemUrl);

    if (!discordResponse.ok) {
      console.error("Erro ao enviar para Discord:", discordResponse.text);
      return NextResponse.json(
        { error: "Erro ao enviar notificação para Discord" },
        { status: 500 }
      );
    }

    // Registrar a prisão no banco para aparecer no histórico
    try {
      await prisma.prisonRecord.create({
        data: {
          nome: nomePreso || "Não informado",
          resumo,
          pena: pena || null,
          multa: multa || null,
          imagemUrl: imagemUrl || null,
          agenteId,
          agenteNome,
          agenteIcName,
        },
      });

      // Criar passagem criminal para o detido se ele existir no sistema
      if (nomePreso) {
        const citizen = await prisma.user.findFirst({
          where: { icName: { equals: nomePreso, mode: "insensitive" } },
        });
        if (citizen) {
          await prisma.record.create({
            data: {
              type: "PRISAO",
              description: resumo.substring(0, 500),
              userId: citizen.id,
              createdById: agenteId,
            },
          });
        }
      }

      await prisma.auditLog.create({
        data: {
          action: "ADD_PRESO",
          details: `Cálculo penal - Preso: ${nomePreso || "Não informado"}. Pena: ${pena || "—"}. Multa: R$ ${multa || "0"}.`,
          executorId: agenteId,
        },
      });
    } catch (logError) {
      console.error("Erro ao criar registros internos:", logError);
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
