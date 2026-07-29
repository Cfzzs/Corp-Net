"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Car,
  Image,
  User,
  FileText,
  Check,
  AlertCircle,
  DollarSign,
  ClipboardList,
  AlertTriangle,
  History,
  X,
} from "lucide-react";

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

  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoVeiculo, setHistoricoVeiculo] = useState<any[]>([]);
  const [showHistorico, setShowHistorico] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const historicoRef = useRef<HTMLDivElement>(null);

  const valorTotal = ARTIGOS
    .filter((a) => formData.artigos.includes(a.id))
    .reduce((sum, a) => sum + a.valor, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "placa" || name === "modelo") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        checkHistorico(value, name);
      }, 600);
    }
  };

  const checkHistorico = async (valor: string, campo: string) => {
    if (valor.length < 3) {
      setHistoricoVeiculo([]);
      setShowHistorico(false);
      return;
    }

    setHistoricoLoading(true);
    try {
      const response = await fetch(`/api/historico?tipo=veiculo&q=${encodeURIComponent(valor)}`);
      const data = await response.json();
      const infractions = data.results?.flatMap((r: any) => r.infractions) || [];
      setHistoricoVeiculo(infractions);
      setShowHistorico(infractions.length > 0);
    } catch {
      setHistoricoVeiculo([]);
      setShowHistorico(false);
    } finally {
      setHistoricoLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historicoRef.current && !historicoRef.current.contains(event.target as Node)) {
        setShowHistorico(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
      setHistoricoVeiculo([]);
      setShowHistorico(false);

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
          <Car className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
            Nova Apreensão Veicular
          </h2>
        </div>
        <p className="text-sm text-gray-400 font-sans">
          Registre a apreensão de um veículo. Informe os dados, selecione os artigos e envie para o Discord.
        </p>
      </div>

      {submitStatus === "success" && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-500 font-mono text-sm">Apreensão registrada com sucesso no Discord!</span>
        </div>
      )}

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
        <div className="tactical-card rounded-2xl p-6 space-y-4 relative" ref={historicoRef}>
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

          {/* Historico do veículo */}
          {historicoLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
              <div className="w-3 h-3 border-2 border-gray-500/30 border-t-gray-500 rounded-full animate-spin" />
              Verificando histórico...
            </div>
          )}

          {showHistorico && !historicoLoading && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-mono text-red-400 uppercase font-bold">
                      VEÍCULO COM PASSAGEM
                    </p>
                    <span className="text-[10px] font-mono text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                      {historicoVeiculo.length} infração(ões)
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {historicoVeiculo.slice(0, 5).map((inf: any) => (
                      <div key={inf.id} className="flex items-center justify-between text-[11px] border-b border-red-500/10 pb-1 last:border-0">
                        <div>
                          <span className="text-gray-300 font-mono">
                            {inf.modelo && `${inf.modelo} `}
                            {inf.cor && `(${inf.cor})`}
                          </span>
                          {inf.agenteIcName && (
                            <span className="text-gray-600 ml-2">por {inf.agenteIcName}</span>
                          )}
                        </div>
                        <span className="text-red-400 font-mono font-bold">
                          R$ {inf.valorTotal.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistorico(false)}
                  className="text-gray-500 hover:text-white transition shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
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
                    R$ {artigo.valor.toLocaleString("pt-BR")}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl mt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-sm font-mono text-white uppercase tracking-wider">Valor Total</span>
            </div>
            <span className="text-xl font-mono font-bold text-primary">
              R$ {valorTotal.toLocaleString("pt-BR")}
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
