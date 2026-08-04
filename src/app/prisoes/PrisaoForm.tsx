"use client";

import React, { useState } from "react";
import {
  ShieldX,
  Image,
  User,
  FileText,
  Check,
  AlertCircle,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

interface PrisaoFormProps {
  userId: string;
  userName: string;
  userIcName: string;
}

export default function PrisaoForm({ userId, userName, userIcName }: PrisaoFormProps) {
  const [formData, setFormData] = useState({
    imagemUrl: "",
    nome: "",
    motivo: "",
    observacoes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    if (!formData.nome) {
      setErrorMessage("Preencha o nome do detido");
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    if (!formData.motivo) {
      setErrorMessage("Informe o motivo da prisão");
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    try {
      const body = new FormData();
      body.append("imagemUrl", formData.imagemUrl);
      body.append("nome", formData.nome);
      body.append("motivo", formData.motivo);
      body.append("observacoes", formData.observacoes);
      body.append("agenteId", userId);
      body.append("agenteNome", userName);
      body.append("agenteIcName", userIcName);

      const response = await fetch("/api/prisoes", {
        method: "POST",
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar registro");
      }

      setSubmitStatus("success");
      setFormData({
        imagemUrl: "",
        nome: "",
        motivo: "",
        observacoes: "",
      });

      setTimeout(() => setSubmitStatus("idle"), 5000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao enviar registro");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="tactical-card rounded-2xl p-6 border-l-4 border-l-primary">
        <div className="flex items-center gap-3 mb-2">
          <ShieldX className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
            Nova Prisão
          </h2>
        </div>
        <p className="text-sm text-gray-400 font-sans">
          Registre a prisão de um cidadão. Informe os dados, o motivo e envie para o Discord.
        </p>
      </div>

      {submitStatus === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-500 font-mono text-sm">Prisão registrada com sucesso no Discord e no histórico!</span>
        </div>
      )}

      {submitStatus === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-500 font-mono text-sm">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Foto */}
        <div className="tactical-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Foto do Detido
            </h3>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
              Link da Imagem (URL)
            </label>
            <input
              type="url"
              name="imagemUrl"
              value={formData.imagemUrl}
              onChange={handleInputChange}
              placeholder="https://cdn.discordapp.com/attachments/..."
              className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
            />
            <p className="text-[10px] text-gray-500 font-mono">
              Cole o link da foto que você tirou pelo celular do jogo
            </p>
          </div>
          {formData.imagemUrl && (
            <div className="rounded-xl overflow-hidden border border-white/10">
              <img
                src={formData.imagemUrl}
                alt="Preview"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        {/* Dados do Detido */}
        <div className="tactical-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Dados do Detido
            </h3>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
              <User className="w-4 h-4" />
              Nome do Preso *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              required
              placeholder="Nome do cidadão preso"
              className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Motivo da Prisão *
            </label>
            <input
              type="text"
              name="motivo"
              value={formData.motivo}
              onChange={handleInputChange}
              required
              placeholder="Ex: Roubo de veículo / Homicídio / Posse ilegal de arma..."
              className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
            />
          </div>

          {/* Agente */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
              <ClipboardList className="w-4 h-4" />
              Agente Responsável
            </label>
            <input
              type="text"
              value={`${userIcName} (${userName})`}
              disabled
              className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-gray-400 font-mono text-sm cursor-not-allowed"
            />
          </div>
        </div>

        {/* Observações */}
        <div className="tactical-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Observações
            </h3>
          </div>
          <textarea
            name="observacoes"
            value={formData.observacoes}
            onChange={handleInputChange}
            rows={3}
            placeholder="Observações adicionais sobre a prisão..."
            className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none placeholder:text-gray-600"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-white font-mono font-bold text-sm px-6 py-4 rounded-xl border border-primary/20 shadow-tactical-glow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <ShieldX className="w-4 h-4" />
              <span>Registrar Prisão</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
