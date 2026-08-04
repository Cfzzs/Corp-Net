"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  User,
  Car,
  AlertTriangle,
  Ban,
  FileText,
  Calendar,
  DollarSign,
  ShieldAlert,
  ScrollText,
  ShieldX,
} from "lucide-react";

export default function HistoricoSearch() {
  const [tipo, setTipo] = useState<"pessoa" | "veiculo">("pessoa");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, [tipo]);

  const handleTipoChange = (novoTipo: "pessoa" | "veiculo") => {
    setResults([]);
    setSearched(false);
    setQuery("");
    setTipo(novoTipo);
  };

  const handleSearch = async () => {
    if (query.length < 2) return;
    setLoading(true);
    setSearched(true);
    try {
      const response = await fetch(`/api/historico?tipo=${tipo}&q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Erro na busca:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const getTipoLabel = (type: string) => {
    const labels: Record<string, string> = {
      ELOGIO: "Elogio",
      OBSERVACAO: "Observação",
      ADVERTENCIA_LEVE: "Advertência Leve",
      ADVERTENCIA_GRAVE: "Advertência Grave",
      PRISAO: "Prisão",
    };
    return labels[type] || type;
  };

  const getTipoColor = (type: string) => {
    switch (type) {
      case "ELOGIO": return "text-emerald-300 border-emerald-400/40 bg-emerald-400/15";
      case "OBSERVACAO": return "text-blue-300 border-blue-400/40 bg-blue-400/15";
      case "ADVERTENCIA_LEVE": return "text-yellow-300 border-yellow-400/40 bg-yellow-400/15";
      case "ADVERTENCIA_GRAVE": return "text-red-300 border-red-400/40 bg-red-400/15";
      case "PRISAO": return "text-red-300 border-red-400/40 bg-red-400/15";
      default: return "text-gray-300 border-white/20 bg-white/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="tactical-card rounded-2xl p-6 border-l-4 border-l-primary">
        <div className="flex items-center gap-3 mb-4">
          <ScrollText className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
            Histórico Criminal
          </h2>
        </div>
        <p className="text-sm text-gray-300 font-sans mb-6">
          Consulte o histórico de pessoas e veículos. Dados de ocorrências, apreensões e infrações.
        </p>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => handleTipoChange("pessoa")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider border transition ${
              tipo === "pessoa"
                ? "bg-primary/10 text-primary border-primary/30 shadow-tactical-glow"
                : "text-gray-400 border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            <User className="w-4 h-4" />
            Pessoas
          </button>
          <button
            onClick={() => handleTipoChange("veiculo")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider border transition ${
              tipo === "veiculo"
                ? "bg-primary/10 text-primary border-primary/30 shadow-tactical-glow"
                : "text-gray-400 border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            <Car className="w-4 h-4" />
            Veículos
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={tipo === "pessoa" ? "Buscar por nome IC ou Discord..." : "Buscar por proprietário ou modelo do veículo..."}
            className="flex-1 bg-tactical-dark border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition placeholder:text-gray-500"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white px-5 py-3 rounded-xl font-mono text-sm border border-primary/20 shadow-tactical-glow transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>Buscar</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-300 font-mono text-xs">Buscando dados...</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="tactical-card rounded-2xl p-12 text-center">
          <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-300 font-mono text-sm">Nenhum resultado encontrado</p>
        </div>
      )}

      {!loading && searched && tipo === "pessoa" && results.map((pessoa: any) => (
        <div key={pessoa.id} className="tactical-card rounded-2xl overflow-hidden border border-white/5">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                pessoa.isProcurado
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-primary/10 border-primary/20"
              }`}>
                <User className={`w-5 h-5 ${pessoa.isProcurado ? "text-red-500" : "text-primary"}`} />
              </div>
              <div>
                <h3 className="text-white font-mono font-bold text-sm">
                  {pessoa.icName || "N/I"}
                </h3>
                <p className="text-gray-400 font-mono text-[11px]">@{pessoa.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pessoa.isProcurado && (
                <span className="flex items-center gap-1 text-[10px] font-mono text-red-300 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded uppercase font-bold">
                  <Ban className="w-3 h-3" /> PROCURADO
                </span>
              )}
              <span className={`text-[10px] font-mono border px-2 py-0.5 rounded uppercase ${
                pessoa.status === "ATIVO" ? "text-emerald-300 border-emerald-400/30 bg-emerald-400/10"
                : pessoa.status === "EM_TESTE" ? "text-yellow-300 border-yellow-400/30 bg-yellow-400/10"
                : pessoa.status === "BANIDO" ? "text-red-300 border-red-400/30 bg-red-400/10"
                : "text-gray-300 border-white/20 bg-white/10"
              }`}>
                {pessoa.role === "-" ? "Fora do sistema" : pessoa.status}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/5">
            <div className="p-4 text-center border-r border-white/5">
              <p className="text-xs text-gray-400 font-mono uppercase">Registros</p>
              <p className="text-lg font-mono font-bold text-white mt-1">{pessoa.records.length}</p>
            </div>
            <div className="p-4 text-center border-r border-white/5">
              <p className="text-xs text-gray-400 font-mono uppercase">Advertências</p>
              <p className={`text-lg font-mono font-bold mt-1 ${pessoa.advertencias > 0 ? "text-red-300" : "text-white"}`}>
                {pessoa.advertencias}
              </p>
            </div>
            <div className="p-4 text-center border-r border-white/5">
              <p className="text-xs text-gray-400 font-mono uppercase">Procurado</p>
              <p className={`text-lg font-mono font-bold mt-1 ${pessoa.isProcurado ? "text-red-300" : "text-emerald-300"}`}>
                {pessoa.isProcurado ? "SIM" : "NÃO"}
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-gray-400 font-mono uppercase">Multas</p>
              <p className={`text-lg font-mono font-bold mt-1 ${pessoa.totalMultas > 0 ? "text-primary" : "text-white"}`}>
                {pessoa.totalMultas > 0 ? `R$ ${pessoa.totalMultas.toLocaleString("pt-BR")}` : "0"}
              </p>
            </div>
          </div>

          {/* Procurado reason */}
          {pessoa.isProcurado && pessoa.blacklistReason && (
            <div className="mx-6 mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-mono text-red-300 uppercase font-bold mb-0.5">Motivo da Procurado</p>
                <p className="text-xs text-gray-200 font-mono">{pessoa.blacklistReason}</p>
              </div>
            </div>
          )}

          {/* Records */}
          {pessoa.records.length > 0 && (
            <div className="p-6 space-y-3">
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                Histórico de Registros
              </p>
              {pessoa.records.map((record: any) => (
                <div key={record.id} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                  <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getTipoColor(record.type)}`}>
                    {getTipoLabel(record.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-200 font-mono">{record.description}</p>
                    <p className="text-[10px] text-gray-400 font-mono mt-1">
                      {new Date(record.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Multas veiculares */}
          {pessoa.multas && pessoa.multas.length > 0 && (
            <div className="p-6 space-y-3">
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <Car className="w-3.5 h-3.5" />
                Multas de Veículos ({pessoa.totalInfracoes})
              </p>
              {pessoa.multas.map((inf: any) => (
                <div key={inf.id} className="bg-white/5 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-xs font-mono text-white font-bold">
                        R$ {inf.valorTotal.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(inf.data).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    {inf.placa && <span className="text-gray-300 font-mono uppercase">{inf.placa}</span>}
                    {inf.modelo && <span className="text-gray-400 font-mono">| {inf.modelo}</span>}
                    {inf.cor && <span className="text-gray-400 font-mono">| {inf.cor}</span>}
                  </div>
                  {inf.imagemUrl && (
                    <img
                      src={inf.imagemUrl}
                      alt="Veículo"
                      className="w-full h-32 object-cover rounded-lg border border-white/5"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  <p className="text-[11px] text-gray-200 font-mono whitespace-pre-line">{inf.artigosTexto}</p>
                  {inf.agenteIcName && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      Registrado por: {inf.agenteIcName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Prisões */}
          {pessoa.prisoes && pessoa.prisoes.length > 0 && (
            <div className="p-6 space-y-3">
              <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-2">
                <ShieldX className="w-3.5 h-3.5" />
                Histórico de Prisões ({pessoa.totalPrisoes})
              </p>
              {pessoa.prisoes.map((p: any) => (
                <div key={p.id} className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span className="text-xs font-mono text-white font-bold uppercase">
                        Prisão
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                      <Calendar className="w-3 h-3" />
                      {new Date(p.data).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  {p.pena && (
                    <p className="text-[11px] font-mono text-red-300 uppercase font-bold">
                      ⏳ {p.pena}
                    </p>
                  )}
                  {p.multa && (
                    <p className="text-[11px] font-mono text-red-300 uppercase font-bold">
                      💰 R$ {p.multa}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-200 font-mono whitespace-pre-line">{p.resumo}</p>
                  {p.imagemUrl && (
                    <img
                      src={p.imagemUrl}
                      alt="Preso"
                      className="w-full h-32 object-cover rounded-lg border border-white/5"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                  {p.agenteIcName && (
                    <p className="text-[10px] text-gray-400 font-mono">
                      Registrado por: {p.agenteIcName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {(pessoa.records.length === 0 && (!pessoa.multas || pessoa.multas.length === 0) && (!pessoa.prisoes || pessoa.prisoes.length === 0)) && (
            <div className="p-6 text-center">
              <p className="text-xs text-gray-400 font-mono">Nenhum registro criminal encontrado</p>
            </div>
          )}
        </div>
      ))}

      {!loading && searched && tipo === "veiculo" && results.map((veiculo: any) => (
        <div key={veiculo.proprietario} className="tactical-card rounded-2xl overflow-hidden border border-white/5">
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-mono font-bold text-sm">{veiculo.proprietario}</h3>
                <p className="text-gray-400 font-mono text-[11px]">{veiculo.totalInfracoes} infração(ões) registrada(s)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-mono uppercase">Total em Multas</p>
              <p className="text-lg font-mono font-bold text-primary">
                R$ {veiculo.totalMultas.toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          {/* Infractions */}
          <div className="p-6 space-y-3">
            <p className="text-[11px] text-gray-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Infrações Registradas
            </p>
            {veiculo.infractions.map((inf: any) => (
              <div key={inf.id} className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary" />
                    <span className="text-xs font-mono text-white font-bold">
                      R$ {inf.valorTotal.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
                    <Calendar className="w-3 h-3" />
                    {new Date(inf.data).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  {inf.modelo && <span className="text-gray-300 font-mono">{inf.modelo}</span>}
                  {inf.cor && <span className="text-gray-400 font-mono">| {inf.cor}</span>}
                </div>
                {inf.imagemUrl && (
                  <img
                    src={inf.imagemUrl}
                    alt="Veículo"
                    className="w-full h-32 object-cover rounded-lg border border-white/5"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                )}
                <p className="text-[11px] text-gray-200 font-mono whitespace-pre-line">{inf.artigosTexto}</p>
                {inf.agenteIcName && (
                  <p className="text-[10px] text-gray-400 font-mono">
                    Registrado por: {inf.agenteIcName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
