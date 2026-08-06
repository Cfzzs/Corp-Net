import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import BlitzPanel from "./BlitzPanel";

export const dynamic = 'force-dynamic';

export default async function BlitzPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const role = session.user.role || "MEMBRO";
  const isAdmin = ["LIDER", "ADMIN", "DEV", "STAFF"].includes(role);

  return (
    <LayoutWrapper title="BLITZ // PONTO DE CONTROLE">
      <div className="max-w-4xl">
        <BlitzPanel
          userId={session.user.id}
          userName={session.user.name || "Agente"}
          userIcName={session.user.icName || "Não configurado"}
          isAdmin={isAdmin}
        />
      </div>
    </LayoutWrapper>
  );
}
