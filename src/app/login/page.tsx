"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, Terminal } from "lucide-react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleDiscordLogin = () => {
    setIsLoading(true);
    signIn("discord", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Image (prs base) */}
      <div className="absolute inset-0 bg-[url('/base-prs.png')] bg-cover bg-center opacity-30 pointer-events-none"></div>

      {/* Background grids and tactical effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(10,19,51,0.5),_var(--tw-gradient-stops))] from-blue-900/40 via-background/90 to-background pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.015)_1px,_transparent_1px)] bg-[size:30px_30px] pointer-events-none"></div>
      
      {/* Radar scanning decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-500/10 rounded-full pointer-events-none radar-glow flex items-center justify-center">
        <div className="w-[400px] h-[400px] border border-blue-500/10 rounded-full flex items-center justify-center">
          <div className="w-[200px] h-[200px] border border-blue-500/10 rounded-full"></div>
        </div>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Logo header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-xl border border-primary bg-primary/10 flex items-center justify-center mb-4 shadow-tactical-glow">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider font-mono text-white">
            CORP<span className="text-primary font-bold">//</span>NET
          </h1>
          <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-mono">
            Polícia Rodoviária Street (PRS)
          </p>
        </div>

        {/* Login Card */}
        <div className="tactical-card rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          
          <h2 className="text-lg font-semibold text-white mb-2 uppercase tracking-wider font-mono border-b border-white/10 pb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" /> AUTENTICAÇÃO REQUISITADA
          </h2>

          <p className="text-xs text-gray-400 font-sans leading-relaxed mb-6 mt-4">
            Para acessar o painel de controle da corporação, é obrigatório vincular sua conta do Discord. 
            Seu Discord ID será utilizado como identificador único no sistema.
          </p>

          {isLoading ? (
            <div className="flex flex-col items-center py-8">
              <div className="w-10 h-10 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-mono text-[#5865F2] tracking-widest">CONECTANDO COM DISCORD...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Discord icon SVG inline */}
              <button
                onClick={handleDiscordLogin}
                className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-4 px-4 rounded-xl flex items-center justify-center gap-3 transition duration-200 shadow-lg shadow-[#5865F2]/20 group text-base"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
                <span>Entrar com Discord</span>
                <ArrowRight className="w-5 h-5 ml-1 opacity-60 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Info box */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-[11px] font-mono text-gray-500 leading-relaxed space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">[&gt;]</span>
                  <span>O acesso requer uma conta ativa no Discord vinculada ao servidor da corporação.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">[&gt;]</span>
                  <span>Ao conectar pela primeira vez, um perfil interno será criado automaticamente com status &quot;Em Teste&quot; (15 dias).</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary font-bold shrink-0">[&gt;]</span>
                  <span>Você precisará registrar seu Nome IC (In Character) para acessar o painel operacional.</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
            ESTA ESTAÇÃO ESTÁ MONITORADA // SECURE HANDSHAKE V2
          </p>
          <p className="text-[10px] text-gray-600 font-mono">
            Desenvolvido por{" "}
            <a href="https://discord.gg/weMksGmu" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors font-bold">
              Eduardo
            </a>
            {" "}— <span className="text-gray-400">Kodo Soft</span>
          </p>
        </div>
      </div>
    </div>
  );
}
