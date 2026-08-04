"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Scale,
  Gavel,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  Pill,
  AlertCircle,
  ShieldAlert,
  DollarSign,
  Clock,
  UserCheck,
  UserX,
  Ban,
  Send,
  Image,
  User,
  ClipboardList,
} from "lucide-react";
import { CRIMES, GRAUS, Crime } from "./crimes";

interface SelectedItem {
  crime: Crime;
  extraQty: string;
}

interface CalculadoraPenalProps {
  userName: string;
  userIcName: string;
}

const formatMes = (meses: number) => {
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (anos > 0 && resto > 0) return `${anos} ano${anos > 1 ? "s" : ""} e ${resto} mes${resto > 1 ? "es" : ""}`;
  if (anos > 0) return `${anos} ano${anos > 1 ? "s" : ""}`;
  return `${meses} mes${meses !== 1 ? "es" : ""}`;
};

export default function CalculadoraPenal({ userName, userIcName }: CalculadoraPenalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [reuPrimario, setReuPrimario] = useState(false);
  const [advogado, setAdvogado] = useState(false);
  const [reincidente, setReincidente] = useState(false);
  const [penaMaxima, setPenaMaxima] = useState(true);
  const [copied, setCopied] = useState(false);
  const [nomePreso, setNomePreso] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return CRIMES;
    return CRIMES.filter((c) =>
      c.nome.toLowerCase().includes(q) ||
      c.artigo.toLowerCase().includes(q) ||
      c.descricao.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const hasDesacatoOuHomicidio = selected.some(
    (s) => s.crime.id === "c19" || s.crime.id === "c30"
  );

  const isSelected = (id: string) => selected.some((s) => s.crime.id === id);

  const addCrime = (crime: Crime) => {
    if (isSelected(crime.id)) return;
    setSelected((prev) => [...prev, { crime, extraQty: "" }]);
  };

  const removeCrime = (id: string) => {
    setSelected((prev) => prev.filter((s) => s.crime.id !== id));
  };

  const setExtraQty = (id: string, value: string) => {
    setSelected((prev) =>
      prev.map((s) => (s.crime.id === id ? { ...s, extraQty: value } : s))
    );
  };

  const calcular = (s: SelectedItem) => {
    let meses = s.crime.penaMeses;
    let multa = s.crime.multa;
    const qtd = parseInt(s.extraQty) || 0;
    if (s.crime.regra) {
      const r = s.crime.regra;
      if (r.tipo === "dinheiroSujo") {
        multa += Math.floor(qtd / r.cada) * r.multaPorCada;
      } else if (r.tipo === "drogas") {
        multa += Math.floor(qtd / r.cada) * r.multaPorCada;
      } else if (r.tipo === "adicional") {
        multa += qtd * r.multaPorCada;
        meses += qtd * (r.mesesPorCada || 0);
      }
    }
    return { meses, multa };
  };

  const baseMeses = selected.reduce((sum, s) => sum + calcular(s).meses, 0);
  const baseMulta = selected.reduce((sum, s) => sum + calcular(s).multa, 0);

  let totalMeses = baseMeses;
  const reducaoAplicavel = !hasDesacatoOuHomicidio;
  if (reducaoAplicavel) {
    if (reuPrimario) totalMeses *= 0.95;
    if (advogado) totalMeses *= 0.80;
  }
  if (reincidente) totalMeses *= 1.10;
  totalMeses = Math.round(totalMeses);
  if (penaMaxima) totalMeses = Math.min(totalMeses, 60);

  const multaAplicada = baseMulta;

  const resumo = useMemo(() => {
    const linhas = selected.map((s) => {
      const { meses, multa } = calcular(s);
      const extras: string[] = [];
      const qtd = parseInt(s.extraQty) || 0;
      if (s.crime.regra && qtd > 0) {
        if (s.crime.regra.tipo === "drogas") extras.push(`+${qtd} und drogas`);
        else if (s.crime.regra.tipo === "dinheiroSujo") extras.push(`+R$ ${qtd.toLocaleString("pt-BR")} sujo`);
        else extras.push(`+${qtd} adicional(is)`);
      }
      return `- ${s.crime.artigo} ${s.crime.nome}${extras.length ? ` (${extras.join(", ")})` : ""} → ${meses > 0 ? formatMes(meses) + ", " : ""}R$ ${multa.toLocaleString("pt-BR")}`;
    });
    const condicoes: string[] = [];
    if (reuPrimario && reducaoAplicavel) condicoes.push("Réu primário (-5%)");
    if (advogado && reducaoAplicavel) condicoes.push("Advogado constituído (-20%)");
    if (reincidente) condicoes.push("Réu reincidente (+10%)");
    if (penaMaxima) condicoes.push("Pena máxima 60 meses");
    if ((reuPrimario || advogado) && !reducaoAplicavel) condicoes.push("Redução NÃO aplicada (Desacato/Homicídio)");

    const texto =
      `📋 CALCULADORA PENAL PRS\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      (linhas.length ? linhas.join("\n") : "Nenhum crime selecionado") +
      `\n━━━━━━━━━━━━━━━━━━\n` +
      (condicoes.length ? `⚖️ Condições: ${condicoes.join(", ")}\n` : "") +
      `⏳ PENA TOTAL: ${totalMeses > 0 ? formatMes(totalMeses) : "Sem prisão"}\n` +
      `💰 MULTA TOTAL: R$ ${multaAplicada.toLocaleString("pt-BR")}`;
    return texto;
  }, [selected, reuPrimario, advogado, reincidente, penaMaxima, totalMeses, multaAplicada, reducaoAplicavel]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resumo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const enviarDiscord = async () => {
    if (selected.length === 0) return;
    setEnviando(true);
    setEnviado(false);
    setErroEnvio("");

    try {
      const body = new FormData();
      body.append("resumo", resumo);
      body.append("nomePreso", nomePreso);
      body.append("imagemUrl", imagemUrl);
      body.append("agenteNome", userName);
      body.append("agenteIcName", userIcName);
      body.append("pena", totalMeses > 0 ? formatMes(totalMeses) : "Sem prisão");
      body.append("multa", multaAplicada.toLocaleString("pt-BR"));

      const response = await fetch("/api/calculadora-penal", {
        method: "POST",
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar para o Discord");
      }

      setEnviado(true);
      setTimeout(() => setEnviado(false), 5000);
    } catch (error) {
      setErroEnvio(error instanceof Error ? error.message : "Erro ao enviar para o Discord");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="tactical-card rounded-2xl p-6 border-l-4 border-l-primary">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
            Calculadora Penal PRS
          </h2>
        </div>
        <p className="text-sm text-gray-400 font-sans">
          Selecione os crimes e as condições do réu para calcular a pena e a multa conforme o Código Penal.
        </p>
      </div>

      {/* Condições */}
      <div className="tactical-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Condições do Réu
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={`flex items-center gap-3 p-4 rounded-xl border transition cursor-pointer ${
            reuPrimario && reducaoAplicavel
              ? "bg-emerald-400/10 border-emerald-400/30"
              : reuPrimario && !reducaoAplicavel
                ? "bg-red-400/10 border-red-400/30"
                : "bg-white/5 border-white/10 hover:border-white/20"
          }`}>
            <input
              type="checkbox"
              checked={reuPrimario}
              onChange={(e) => setReuPrimario(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <div className="flex-1">
              <p className="text-sm font-mono text-white font-bold">Réu Primário</p>
              <p className="text-[11px] text-gray-400 font-mono">5% de redução na pena</p>
            </div>
            <span className={`text-xs font-mono font-bold ${reuPrimario && reducaoAplicavel ? "text-emerald-300" : reuPrimario && !reducaoAplicavel ? "text-red-300" : "text-gray-500"}`}>
              {reuPrimario && reducaoAplicavel ? "-5%" : reuPrimario && !reducaoAplicavel ? "N/A" : ""}
            </span>
          </label>

          <label className={`flex items-center gap-3 p-4 rounded-xl border transition cursor-pointer ${
            advogado && reducaoAplicavel
              ? "bg-emerald-400/10 border-emerald-400/30"
              : advogado && !reducaoAplicavel
                ? "bg-red-400/10 border-red-400/30"
                : "bg-white/5 border-white/10 hover:border-white/20"
          }`}>
            <input
              type="checkbox"
              checked={advogado}
              onChange={(e) => setAdvogado(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <div className="flex-1">
              <p className="text-sm font-mono text-white font-bold">Advogado Constituído</p>
              <p className="text-[11px] text-gray-400 font-mono">20% de redução na pena</p>
            </div>
            <span className={`text-xs font-mono font-bold ${advogado && reducaoAplicavel ? "text-emerald-300" : advogado && !reducaoAplicavel ? "text-red-300" : "text-gray-500"}`}>
              {advogado && reducaoAplicavel ? "-20%" : advogado && !reducaoAplicavel ? "N/A" : ""}
            </span>
          </label>

          <label className={`flex items-center gap-3 p-4 rounded-xl border transition cursor-pointer ${
            reincidente
              ? "bg-red-400/10 border-red-400/30"
              : "bg-white/5 border-white/10 hover:border-white/20"
          }`}>
            <input
              type="checkbox"
              checked={reincidente}
              onChange={(e) => setReincidente(e.target.checked)}
              className="w-4 h-4 accent-red-500"
            />
            <div className="flex-1">
              <p className="text-sm font-mono text-white font-bold">Réu Reincidente</p>
              <p className="text-[11px] text-gray-400 font-mono">Aumento de 10% na pena total (mesmo crime +1 vez)</p>
            </div>
            <span className={`text-xs font-mono font-bold ${reincidente ? "text-red-300" : "text-gray-500"}`}>
              {reincidente ? "+10%" : ""}
            </span>
          </label>

          <label className={`flex items-center gap-3 p-4 rounded-xl border transition cursor-pointer ${
            penaMaxima
              ? "bg-yellow-400/10 border-yellow-400/30"
              : "bg-white/5 border-white/10 hover:border-white/20"
          }`}>
            <input
              type="checkbox"
              checked={penaMaxima}
              onChange={(e) => setPenaMaxima(e.target.checked)}
              className="w-4 h-4 accent-yellow-500"
            />
            <div className="flex-1">
              <p className="text-sm font-mono text-white font-bold">Pena Máxima: 60 meses</p>
              <p className="text-[11px] text-gray-400 font-mono">Desmarque para casos graves analisados pelo jurídico</p>
            </div>
            <span className={`text-xs font-mono font-bold ${penaMaxima ? "text-yellow-300" : "text-gray-500"}`}>
              {penaMaxima ? "60M" : "LIVRE"}
            </span>
          </label>
        </div>
        {hasDesacatoOuHomicidio && (reuPrimario || advogado) && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            <Ban className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs font-mono text-red-300">
              Reduções de Réu Primário/Advogado NÃO se aplicam quando há Desacato ou Homicídio na lista.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* LISTA DE CRIMES */}
        <div className="lg:col-span-3 tactical-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Catálogo de Crimes</h3>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar crime por nome ou artigo..."
              className="w-full bg-tactical-dark border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-6 max-h-[520px] overflow-y-auto pr-1">
            {GRAUS.map((grau) => {
              const crimes = filtered.filter((c) => c.grau === grau.id);
              if (crimes.length === 0) return null;
              return (
                <div key={grau.id} className="space-y-2">
                  <span className={`inline-block text-[10px] font-mono border px-2 py-0.5 rounded uppercase font-bold ${grau.cor}`}>
                    {grau.label}
                  </span>
                  <div className="space-y-2">
                    {crimes.map((crime) => (
                      <div key={crime.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-primary border border-primary/20 bg-primary/5 px-1.5 py-0.5 rounded">
                              {crime.artigo}
                            </span>
                            <span className="text-xs font-mono font-bold text-white">{crime.nome}</span>
                          </div>
                          <p className="text-[11px] text-gray-400 font-mono mt-1">{crime.descricao}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] font-mono">
                            {crime.penaMeses > 0 && (
                              <span className="flex items-center gap-1 text-gray-300">
                                <Clock className="w-3 h-3 text-gray-500" /> {formatMes(crime.penaMeses)}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-gray-300">
                              <DollarSign className="w-3 h-3 text-gray-500" /> R$ {crime.multa.toLocaleString("pt-BR")}
                            </span>
                          </div>
                          {crime.regra && (
                            <p className="flex items-center gap-1 text-[10px] text-yellow-300/90 font-mono mt-1.5">
                              <AlertCircle className="w-3 h-3 shrink-0" /> {crime.regra.texto}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => addCrime(crime)}
                          disabled={isSelected(crime.id)}
                          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border transition disabled:opacity-40 disabled:cursor-not-allowed bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-black"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PENA CALCULADA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="tactical-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Pena Calculada</h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500">{selected.length} crime(s)</span>
            </div>

            {selected.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 border border-dashed border-white/5 rounded-xl bg-black/5 font-mono text-xs">
                <Gavel className="w-8 h-8 mb-2 text-gray-600" />
                <span>NENHUM CRIME SELECIONADO</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {selected.map((s) => {
                  const { meses, multa } = calcular(s);
                  return (
                    <div key={s.crime.id} className="bg-white/5 rounded-xl p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono font-bold text-primary border border-primary/20 bg-primary/5 px-1.5 py-0.5 rounded shrink-0">
                            {s.crime.artigo}
                          </span>
                          <span className="text-xs font-mono font-bold text-white truncate">{s.crime.nome}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCrime(s.crime.id)}
                          className="shrink-0 text-gray-500 hover:text-danger transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {s.crime.regra && (
                        <div className="flex items-center gap-2">
                          {s.crime.regra.tipo === "drogas" ? (
                            <>
                              <Pill className="w-3.5 h-3.5 text-emerald-400" />
                              <input
                                type="number"
                                min={0}
                                value={s.extraQty}
                                onChange={(e) => setExtraQty(s.crime.id, e.target.value)}
                                className="w-20 text-center bg-tactical-dark border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                              />
                              <span className="text-[10px] font-mono text-gray-400">und de drogas</span>
                            </>
                          ) : s.crime.regra.tipo === "dinheiroSujo" ? (
                            <>
                              <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
                              <input
                                type="number"
                                min={0}
                                value={s.extraQty}
                                onChange={(e) => setExtraQty(s.crime.id, e.target.value)}
                                className="w-24 text-center bg-tactical-dark border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                              />
                              <span className="text-[10px] font-mono text-gray-400">valor sujo (R$)</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                              <input
                                type="number"
                                min={0}
                                value={s.extraQty}
                                onChange={(e) => setExtraQty(s.crime.id, e.target.value)}
                                className="w-16 text-center bg-tactical-dark border border-white/10 rounded-lg px-2 py-1.5 text-white font-mono text-xs focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
                              />
                              <span className="text-[10px] font-mono text-gray-400">adicional(is)</span>
                            </>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
                        {meses > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" /> {formatMes(meses)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-gray-500" /> R$ {multa.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* DADOS DO PRESO */}
          <div className="tactical-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Dados do Preso
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Nome do Preso *
              </label>
              <input
                type="text"
                value={nomePreso}
                onChange={(e) => setNomePreso(e.target.value)}
                placeholder="Nome do preso condenado"
                className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                Link da Foto (URL)
              </label>
              <input
                type="url"
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                placeholder="https://cdn.discordapp.com/attachments/..."
                className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
              />
              <p className="text-[10px] text-gray-500 font-mono">
                Cole o link da foto que você tirou pelo celular do jogo
              </p>
            </div>

            {imagemUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10">
                <img
                  src={imagemUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

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

          {/* RESULTADO FINAL */}
          <div className="tactical-card rounded-2xl p-6 space-y-4 border-l-4 border-l-primary">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Resultado Final</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-tactical-dark border border-white/10 rounded-xl p-4 text-center">
                <p className="text-[10px] text-gray-400 font-mono uppercase flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> Pena
                </p>
                <p className="text-lg font-mono font-bold text-white mt-1">
                  {totalMeses > 0 ? formatMes(totalMeses) : "—"}
                </p>
              </div>
              <div className="bg-tactical-dark border border-white/10 rounded-xl p-4 text-center">
                <p className="text-[10px] text-gray-400 font-mono uppercase flex items-center justify-center gap-1">
                  <DollarSign className="w-3 h-3" /> Multa
                </p>
                <p className="text-lg font-mono font-bold text-primary mt-1">
                  R$ {multaAplicada.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

            {selected.length > 0 && (
              <div className="space-y-1 text-[10px] font-mono text-gray-400">
                {baseMeses > 0 && (
                  <p className="flex justify-between">
                    <span>Pena base</span>
                    <span>{formatMes(baseMeses)}</span>
                  </p>
                )}
                {reducaoAplicavel && reuPrimario && (
                  <p className="flex justify-between text-emerald-400">
                    <span>Réu primário</span>
                    <span>-5%</span>
                  </p>
                )}
                {reducaoAplicavel && advogado && (
                  <p className="flex justify-between text-emerald-400">
                    <span>Advogado constituído</span>
                    <span>-20%</span>
                  </p>
                )}
                {reincidente && (
                  <p className="flex justify-between text-red-400">
                    <span>Reincidência</span>
                    <span>+10%</span>
                  </p>
                )}
                {penaMaxima && totalMeses === 60 && baseMeses > 60 && (
                  <p className="flex justify-between text-yellow-400">
                    <span>Pena máxima aplicada</span>
                    <span>60 meses</span>
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={copyToClipboard}
              disabled={selected.length === 0}
              className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Resultado</span>
                </>
              )}
            </button>

            {erroEnvio && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-500 font-mono text-sm">{erroEnvio}</span>
              </div>
            )}

            {enviado && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-500 font-mono text-sm">Cálculo enviado para o Discord!</span>
              </div>
            )}

            <button
              type="button"
              onClick={enviarDiscord}
              disabled={enviando || selected.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition uppercase disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar para o Discord</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
