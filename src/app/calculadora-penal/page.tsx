import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import CalculadoraPenal from "./CalculadoraPenal";

export const dynamic = 'force-dynamic';

export default async function CalculadoraPenalPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <LayoutWrapper title="CALCULADORA PENAL // PRS">
      <div className="max-w-7xl">
        <CalculadoraPenal
          userId={session.user.id}
          userName={session.user.name || "Agente"}
          userIcName={session.user.icName || "Não configurado"}
        />
      </div>
    </LayoutWrapper>
  );
}
