"use client";

import React, { useState } from "react";
import {
  Car,
  Image,
  User,
  FileText,
  Check,
  AlertCircle,
  DollarSign,
  ClipboardList,
} from "lucide-react";

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

interface ApreensaoVeicularFormProps {
  userId: string;
  userName: string;
  userIcName: string;
}

export default function ApreensaoVeicularForm({ userId, userName, userIcName }: ApreensaoVeicularFormProps) {
  const [formData, setFormData] = useState({
    imagemUrl: "",
    proprietario: "",
    placa: "",
    modelo: "",
    cor: "",
    artigos: [] as string[],
    observacoes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const valorTotal = ARTIGOS
    .filter((a) => formData.artigos.includes(a.id))
    .reduce((sum, a) => sum + a.valor, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleArtigoToggle = (artigoId: string) => {
    setFormData((prev) => {
      const jaSelecionado = prev.artigos.includes(artigoId);
      return {
        ...prev,
        artigos: jaSelecionado
          ? prev.artigos.filter((id) => id !== artigoId)
          : [...prev.artigos, artigoId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    if (!formData.proprietario) {
      setErrorMessage("Preencha o nome do proprietário");
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    if (formData.artigos.length === 0) {
      setErrorMessage("Selecione pelo menos um artigo");
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    try {
      const body = new FormData();
      body.append("imagemUrl", formData.imagemUrl);
      body.append("proprietario", formData.proprietario);
      body.append("placa", formData.placa);
      body.append("modelo", formData.modelo);
      body.append("cor", formData.cor);
      body.append("artigos", JSON.stringify(formData.artigos));
      body.append("observacoes", formData.observacoes);
      body.append("agenteId", userId);
      body.append("agenteNome", userName);
      body.append("agenteIcName", userIcName);

      const response = await fetch("/api/apreensao-veicular", {
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
        proprietario: "",
        placa: "",
        modelo: "",
        cor: "",
        artigos: [],
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
      {/* Header */}
      <div className="tactical-card rounded-2xl p-6 border-l-4 border-l-primary">
        <div className="flex items-center gap-3 mb-2">
          <Car className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
            Nova Apreensão Veicular
          </h2>
        </div>
        <p className="text-sm text-gray-400 font-sans">
          Registre a apreensão de um veículo. Informe os dados, selecione os artigos e envie para o Discord.
        </p>
      </div>

      {/* Success */}
      {submitStatus === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-500 font-mono text-sm">Apreensão registrada com sucesso no Discord!</span>
        </div>
      )}

      {/* Error */}
      {submitStatus === "error" && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-500 font-mono text-sm">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Imagem */}
        <div className="tactical-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Foto do Veículo
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
              Cole o link da imagem que você tirou pelo celular do jogo
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

        {/* Dados do Veículo */}
        <div className="tactical-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Dados do Veículo
            </h3>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
              <User className="w-4 h-4" />
              Proprietário *
            </label>
            <input
              type="text"
              name="proprietario"
              value={formData.proprietario}
              onChange={handleInputChange}
              required
              placeholder="Nome do proprietário do veículo"
              className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Placa
              </label>
              <input
                type="text"
                name="placa"
                value={formData.placa}
                onChange={handleInputChange}
                placeholder="ABC-1234"
                className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600 uppercase"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Modelo
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                placeholder="Ex: BMW M5"
                className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Cor
              </label>
              <input
                type="text"
                name="cor"
                value={formData.cor}
                onChange={handleInputChange}
                placeholder="Ex: Preto"
                className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
              />
            </div>
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

        {/* Artigos */}
        <div className="tactical-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Artigos Aplicados *
              </h3>
            </div>
            {formData.artigos.length > 0 && (
              <span className="text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                {formData.artigos.length} selecionado(s)
              </span>
            )}
          </div>

          <div className="space-y-2">
            {ARTIGOS.map((artigo) => {
              const isSelected = formData.artigos.includes(artigo.id);
              return (
                <button
                  key={artigo.id}
                  type="button"
                  onClick={() => handleArtigoToggle(artigo.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition font-mono text-sm ${
                    isSelected
                      ? "bg-primary/10 border-primary/30 text-white"
                      : "bg-tactical-dark border-white/10 text-gray-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${
                      isSelected ? "bg-primary border-primary" : "border-white/20"
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-xs">{artigo.descricao}</span>
                  </div>
                  <span className={`text-xs font-bold ${isSelected ? "text-primary" : "text-gray-500"}`}>
                    R$ {artigo.valor.toLocaleString('pt-BR')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Valor Total */}
          <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl mt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-sm font-mono text-white uppercase tracking-wider">Valor Total</span>
            </div>
            <span className="text-xl font-mono font-bold text-primary">
              R$ {valorTotal.toLocaleString('pt-BR')}
            </span>
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
            placeholder="Observações adicionais sobre a apreensão..."
            className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition resize-none placeholder:text-gray-600"
          />
        </div>

        {/* Submit */}
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
              <Car className="w-4 h-4" />
              <span>Registrar Apreensão Veicular</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
