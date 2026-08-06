"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  TrafficCone,
  MapPin,
  Timer,
  UserCheck,
  DoorOpen,
  Lock,
  AlertCircle,
  Check,
  Car,
  ShieldAlert,
  Play,
  X,
} from "lucide-react";

interface BlitzPanelProps {
  userId: string;
  userName: string;
  userIcName: string;
  isAdmin: boolean;
}

interface Presenca {
  id: string;
  userId: string;
  nome: string;
  discord: string;
  matricula: string;
  patente: string;
  entrada: string;
  saida: string | null;
}

interface Blitz {
  id: string;
  local: string;
  abertaPorNome: string;
  abertaPorIcName: string;
  abertaEm: string;
  fechadaEm: string | null;
  veiculosApreendidos: string[];
  presencas: Presenca[];
}

function fmtHMS(millis: number): string {
  const total = Math.max(0, Math.floor(millis / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [String(h).padStart(2, "0"), String(m).padStart(2, "0"), String(s).padStart(2, "0")].join(":");
}

function fmtDateTime(d: string): string {
  const date = new Date(d);
  return date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR");
}

export default function BlitzPanel({ userId, userName, userIcName, isAdmin }: BlitzPanelProps) {
  const [blitzAberta, setBlitzAberta] = useState<Blitz | null>(null);
  const [historico, setHistorico] = useState<Blitz[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const [local, setLocal] = useState("");
  const [matricula, setMatricula] = useState("");
  const [patente, setPatente] = useState("");
  const [veiculos, setVeiculos] = useState("");

  const [showFecharModal, setShowFecharModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/blitz");
      const data = await res.json();
      if (res.ok) {
        setBlitzAberta(data.blitzAberta);
        setHistorico(data.historico || []);
      }
    } catch (error) {
      console.error("Erro ao carregar blitz:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const dataTimer = setInterval(load, 5000);
    const tickTimer = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(dataTimer);
      clearInterval(tickTimer);
    };
  }, [load]);

  const showStatus = (ok: boolean, msg: string) => {
    setStatus({ ok, msg });
    if (statusTimer.current) clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => setStatus(null), 5000);
  };

  const doAction = async (action: string, extra?: Record<string, string>) => {
    setBusy(true);
    setStatus(null);
    try {
      const formData = new FormData();
      formData.append("action", action);
      Object.entries(extra || {}).forEach(([k, v]) => formData.append(k, v));
      const res = await fetch("/api/blitz", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        showStatus(false, data.error || "Erro ao executar ação");
      } else {
        showStatus(true, "Ação executada com sucesso");
      }
      await load();
    } catch (error) {
      console.error(error);
      showStatus(false, "Erro de conexão ao executar ação");
    } finally {
      setBusy(false);
    }
  };

  const abrirBlitz = () => {
    if (!local.trim()) {
      showStatus(false, "Informe o local da blitz");
      return;
    }
    doAction("open", { local });
    setLocal("");
  };

  const marcarPresenca = () => {
    doAction("presenca", { matricula, patente });
    setMatricula("");
    setPatente("");
  };

  const sairBlitz = () => doAction("sair");

  const fecharBlitz = () => {
    doAction("fechar", { veiculos });
    setVeiculos("");
    setShowFecharModal(false);
  };

  const minhaPresencaAtiva = blitzAberta?.presencas.find((p) => p.userId === userId && !p.saida) || null;
  const presentes = (blitzAberta?.presencas || []).filter((p) => !p.saida);
  const duracaoBlitz = blitzAberta ? now - new Date(blitzAberta.abertaEm).getTime() : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="tactical-card rounded-2xl p-6 border-l-4 border-l-amber-500">
        <div className="flex items-center gap-3 mb-2">
          <TrafficCone className="w-6 h-6 text-amber-500" />
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
            Ponto de Controle / Blitz
          </h2>
        </div>
        <p className="text-sm text-gray-400 font-sans">
          Coordene a blitz, marque presença com matrícula e patente, e encerre com o balanço de veículos
          apreendidos. Tudo registrado e notificado no Discord.
        </p>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`rounded-xl p-4 flex items-center gap-3 border ${status.ok ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          {status.ok ? (
            <Check className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          <span className={`font-mono text-sm ${status.ok ? "text-emerald-500" : "text-red-500"}`}>{status.msg}</span>
        </div>
      )}

      {/* OPEN BLITZ */}
      {loading ? (
        <div className="tactical-card rounded-2xl p-10 text-center">
          <p className="text-sm text-gray-500 font-mono">Carregando status da blitz...</p>
        </div>
      ) : blitzAberta ? (
        <div className="tactical-card rounded-2xl overflow-hidden border border-amber-500/20">
          {/* Header status */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-white font-mono font-bold text-sm uppercase flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Blitz em Andamento
                </h3>
                <p className="text-gray-400 font-mono text-[11px]">ID: {blitzAberta.id}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-mono uppercase">Duração</p>
              <p className="text-lg font-mono font-bold text-amber-500">{fmtHMS(duracaoBlitz)}</p>
            </div>
          </div>

          {/* Info */}
          <div className="p-6 border-b border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-mono uppercase">Local</p>
                <p className="text-sm text-white font-mono">{blitzAberta.local}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-mono uppercase">Aberta por</p>
                <p className="text-sm text-white font-mono">
                  {blitzAberta.abertaPorIcName} (@{blitzAberta.abertaPorNome})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Timer className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-mono uppercase">Início</p>
                <p className="text-sm text-white font-mono">{fmtDateTime(blitzAberta.abertaEm)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-mono uppercase">Agentes presentes</p>
                <p className="text-sm text-white font-mono">{presentes.length} na ativa</p>
              </div>
            </div>
          </div>

          {/* Presentes */}
          <div className="p-6 space-y-3">
            <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-3.5 h-3.5" />
              Presença na Ativa
            </p>
            {presentes.length === 0 && (
              <p className="text-xs text-gray-500 font-mono">Nenhum agente marcou presença ainda.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presentes.map((p) => (
                <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-mono font-bold truncate">{p.nome}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">
                        {p.patente} | Matrícula {p.matricula}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] text-gray-500 font-mono uppercase">Desde</p>
                    <p className="text-xs text-emerald-500 font-mono font-bold">{fmtHMS(now - new Date(p.entrada).getTime())}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ações do usuário */}
          <div className="p-6 border-t border-white/5">
            {minhaPresencaAtiva ? (
              <button
                onClick={sairBlitz}
                disabled={busy}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-bold text-sm px-6 py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <DoorOpen className="w-4 h-4" />
                {busy ? "Processando..." : "🚪 Sair da Blitz"}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
                      Matrícula *
                    </label>
                    <input
                      type="text"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Ex: 1234"
                      className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
                      Patente *
                    </label>
                    <input
                      type="text"
                      value={patente}
                      onChange={(e) => setPatente(e.target.value)}
                      placeholder="Ex: Sargento"
                      className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
                    />
                  </div>
                </div>
                <button
                  onClick={marcarPresenca}
                  disabled={busy}
                  className="w-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-sm px-6 py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  {busy ? "Processando..." : "✅ Marcar Presença"}
                </button>
              </div>
            )}

            {isAdmin && (
              <button
                onClick={() => setShowFecharModal(true)}
                className="mt-3 w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-mono font-bold text-sm px-6 py-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                🔒 Fechar Blitz
              </button>
            )}
          </div>
        </div>
      ) : (
        /* NO OPEN BLITZ */
        <div className="tactical-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <TrafficCone className="w-6 h-6 text-gray-500" />
            <h3 className="text-white font-mono font-bold text-sm uppercase">Nenhuma blitz aberta</h3>
          </div>
          {isAdmin ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  Local da Blitz *
                </label>
                <input
                  type="text"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex: Rodovia BR-116, KM 45"
                  className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-600"
                />
              </div>
              <button
                onClick={abrirBlitz}
                disabled={busy}
                className="w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 font-mono font-bold text-sm px-6 py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                {busy ? "Abrindo..." : "🚨 Abrir Blitz"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-mono">
              Aguarde um líder/administrador abrir a blitz para marcar sua presença.
            </p>
          )}
        </div>
      )}

      {/* HISTÓRICO */}
      {historico.length > 0 && (
        <div className="tactical-card rounded-2xl p-6 space-y-4">
          <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-2">
            <TrafficCone className="w-3.5 h-3.5" />
            Últimas Blitzes
          </p>
          <div className="space-y-3">
            {historico.map((h) => {
              const porUsuario = new Map<string, { nome: string; total: number }>();
              for (const p of h.presencas) {
                const fim = p.saida || h.fechadaEm;
                const dur = fim ? new Date(fim).getTime() - new Date(p.entrada).getTime() : 0;
                const atual = porUsuario.get(p.userId) || { nome: p.nome, total: 0 };
                atual.total += dur;
                porUsuario.set(p.userId, atual);
              }
              const totalPresentes = porUsuario.size;
              const duracao = h.fechadaEm
                ? fmtHMS(new Date(h.fechadaEm).getTime() - new Date(h.abertaEm).getTime())
                : "—";
              return (
                <div key={h.id} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Car className="w-4 h-4 text-gray-400 shrink-0" />
                      <p className="text-sm text-white font-mono font-bold truncate">{h.local}</p>
                    </div>
                    <div className="flex gap-2 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                        {fmtDateTime(h.abertaEm)}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                        ⏱️ {duracao}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                        {totalPresentes} presente(s)
                      </span>
                    </div>
                  </div>
                  {Array.from(porUsuario.entries()).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(porUsuario.entries()).map(([uid, v]) => (
                        <span key={uid} className="text-[10px] font-mono text-gray-300 bg-white/5 border border-white/10 rounded px-2 py-1">
                          {v.nome} — {fmtHMS(v.total)}
                        </span>
                      ))}
                    </div>
                  )}
                  {h.veiculosApreendidos.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mb-1">🚗 Veículos Apreendidos</p>
                      <div className="flex flex-wrap gap-2">
                        {h.veiculosApreendidos.map((v, i) => (
                          <span key={i} className="text-[10px] font-mono text-red-300 bg-red-500/5 border border-red-500/20 rounded px-2 py-1">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL FECHAR */}
      {showFecharModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="tactical-card rounded-2xl max-w-lg w-full p-6 space-y-4 border border-red-500/30">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-mono font-bold text-sm uppercase flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                Encerrar Blitz
              </h3>
              <button onClick={() => setShowFecharModal(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-wider">
                <Car className="w-4 h-4" />
                Veículos Apreendidos (1 por linha)
              </label>
              <textarea
                value={veiculos}
                onChange={(e) => setVeiculos(e.target.value)}
                rows={5}
                placeholder={"Ex: BMW M5 - Placa ABC1234\nMercedes-Benz C180 - Placa XYZ5678"}
                className="w-full bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition placeholder:text-gray-600 resize-none"
              />
            </div>
            <button
              onClick={fecharBlitz}
              disabled={busy}
              className="w-full bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-mono font-bold text-sm px-6 py-4 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {busy ? "Encerrando..." : "🔒 Confirmar Encerramento"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
