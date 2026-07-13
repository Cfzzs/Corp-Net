"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Terminal, ShieldAlert, CheckCircle, ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { data: session, update, status } = useSession();
  const router = useRouter();
  const [icName, setIcName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);

  // Ao montar, força refresh da sessão para pegar dados frescos do banco
  // Isso resolve o problema do JWT cacheado com dados antigos
  useEffect(() => {
    const refreshAndCheck = async () => {
      try {
        await update(); // Força o JWT callback a buscar dados atualizados do banco
      } catch (_) {
        // Ignora erros silenciosos
      } finally {
        setIsRefreshing(false);
      }
    };
    refreshAndCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Após o refresh, se o usuário já tem icName, redireciona para o dashboard
  useEffect(() => {
    if (!isRefreshing && session?.user?.icName) {
      router.replace("/dashboard");
    }
  }, [isRefreshing, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icName.trim()) {
      setError("O Nome IC não pode ser vazio.");
      return;
    }
    if (icName.trim().length < 3) {
      setError("O Nome IC deve conter pelo menos 3 caracteres.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icName: icName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Erro ao salvar o nome.");
      }

      // Atualiza a sessão: o JWT callback vai buscar os dados frescos do banco
      await update();

      setSuccess(true);
      setTimeout(() => {
        router.replace("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Falha na comunicação com o servidor.");
      setIsSubmitting(false);
    }
  };

  // Tela de carregamento enquanto verifica a sessão
  if (isRefreshing || status === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-gray-400 text-xs font-mono uppercase tracking-widest mt-4">Verificando sessão...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 relative font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.01)_1px,_transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="tactical-card rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

          <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wider font-mono flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary animate-pulse" /> CONFIGURAR PERFIL
          </h2>
          <p className="text-gray-400 text-xs uppercase tracking-widest font-mono mb-6 border-b border-white/5 pb-3">
            Primeiro Acesso // Registre seu personagem
          </p>

          {success ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle className="w-12 h-12 text-success mb-3 animate-bounce" />
              <p className="text-success font-mono font-semibold uppercase tracking-wider">REGISTRO EFETUADO COM SUCESSO</p>
              <p className="text-gray-400 text-xs mt-1">Carregando painel operacional...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-xs text-yellow-500 font-mono mb-4">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <div>
                  <p className="font-bold uppercase tracking-wider mb-1">ATENÇÃO SOLDADO/AGENTE:</p>
                  <p className="leading-relaxed">
                    Insira seu nome &quot;In-Game&quot; exatamente como está registrado no servidor da cidade (ex: Silva_IC ou Carlos Silva).
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-xs text-danger font-mono uppercase tracking-wider">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">
                  Nome IC (No Jogo)
                </label>
                <input
                  type="text"
                  value={icName}
                  onChange={(e) => setIcName(e.target.value)}
                  placeholder="Ex: Pedro_Almeida"
                  disabled={isSubmitting}
                  className="w-full bg-tactical-dark border border-white/10 hover:border-white/20 focus:border-primary/50 text-white placeholder-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none transition font-mono uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary-hover text-black font-mono font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 uppercase"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gravando Ficha...</span>
                  </>
                ) : (
                  <>
                    <span>Finalizar Cadastro</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
