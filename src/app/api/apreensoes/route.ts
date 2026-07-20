import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const tipoOperacao = formData.get("tipoOperacao") as string;
    const dataHora = formData.get("dataHora") as string;
    const localizacao = formData.get("localizacao") as string;
    const qru = formData.get("qru") as string;
    const veiculoEnvolvido = formData.get("veiculoEnvolvido") as string;
    const envolvidosStr = formData.get("envolvidos") as string;
    const procedimentosAdotados = formData.get("procedimentosAdotados") as string;
    const agenteId = formData.get("agenteId") as string;
    const agenteNome = formData.get("agenteNome") as string;
    const agenteIcName = formData.get("agenteIcName") as string;
    const imagem = formData.get("imagem") as File | null;

    // Validação básica
    if (!tipoOperacao || !dataHora || !localizacao || !qru || !agenteId || !agenteNome) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      );
    }

    // Parse envolvidos
    let envolvidos: any[] = [];
    try {
      envolvidos = JSON.parse(envolvidosStr || "[]");
    } catch {
      envolvidos = [];
    }

    // Create Discord mentions for envolvidos
    const envolvidosMentions = envolvidos
      .map((u: any) => `<@${u.id}>`)
      .join(", ");
    
    const envolvidosNames = envolvidos
      .map((u: any) => u.icName || u.name)
      .join(", ");

    // Formatar data/hora para exibição (usar o valor digitado diretamente)
    const dataFormatada = dataHora;

    // Montar payload do Discord
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL_APREENSOES;
    
    if (!webhookUrl) {
      console.error("DISCORD_WEBHOOK_URL_APREENSOES não configurado");
      return NextResponse.json(
        { error: "Webhook do Discord não configurado" },
        { status: 500 }
      );
    }

    const embedPayload = {
      content: envolvidosMentions ? `<@&1341103708519403522> ${envolvidosMentions}` : "<@&1341103708519403522>",
      embeds: [
        {
          title: "🚨 REGISTRO DE APREENSÃO - PRS",
          color: 42168, // Azul (Decimal)
          fields: [
            {
              name: "📋 Tipo de Operação",
              value: tipoOperacao,
              inline: true
            },
            {
              name: "📍 Localização",
              value: localizacao,
              inline: true
            },
            {
              name: "🕐 Data/Hora",
              value: dataFormatada,
              inline: true
            },
            {
              name: "👮 Agente Responsável",
              value: `${agenteIcName || "N/A"} (@${agenteNome})\nID: ${agenteId}`,
              inline: false
            },
            {
              name: "📝 QRU",
              value: qru.substring(0, 1000),
              inline: false
            },
            {
              name: "🚗 Veículo Envolvido",
              value: veiculoEnvolvido || "Nenhum",
              inline: true
            },
            {
              name: "👥 Envolvidos",
              value: envolvidosNames || "Nenhum",
              inline: false
            },
            {
              name: "📋 Procedimentos Adotados",
              value: procedimentosAdotados || "Nenhum",
              inline: false
            }
          ],
          footer: {
            text: "PRS - Polícia Rodoviária Street. Disciplina, compromisso e excelência no patrulhamento.",
            icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
          },
          timestamp: new Date().toISOString(),
          image: imagem ? { url: "attachment://image.png" } : undefined
        }
      ]
    };

    // Se houver imagem, enviar como multipart/form-data
    if (imagem) {
      const webhookFormData = new FormData();
      webhookFormData.append("payload_json", JSON.stringify(embedPayload));
      webhookFormData.append("files[0]", imagem, "image.png");

      const discordResponse = await fetch(webhookUrl, {
        method: "POST",
        body: webhookFormData,
      });

      if (!discordResponse.ok) {
        const errorText = await discordResponse.text();
        console.error("Erro ao enviar para Discord:", errorText);
        return NextResponse.json(
          { error: "Erro ao enviar notificação para Discord" },
          { status: 500 }
        );
      }
    } else {
      // Sem imagem, enviar como JSON normal
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
    }

    // Criar log de auditoria
    try {
      const envolvidosDetails = envolvidos.map((u: any) => `${u.icName || u.name} (@${u.name})`).join(", ");
      
      await prisma.auditLog.create({
        data: {
          action: "ADD_APREENSAO",
          details: `Registro de apreensão - ${tipoOperacao} em ${localizacao}. Envolvidos: ${envolvidosDetails || "Nenhum"}. Veículo: ${veiculoEnvolvido || "Nenhum"}.`,
          executorId: agenteId,
        },
      });
    } catch (logError) {
      console.error("Erro ao criar log de auditoria:", logError);
      // Não falhar a requisição se o log falhar
    }

    return NextResponse.json(
      { success: true, message: "Registro enviado com sucesso" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao processar registro de apreensão:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar registro" },
      { status: 500 }
    );
  }
}
