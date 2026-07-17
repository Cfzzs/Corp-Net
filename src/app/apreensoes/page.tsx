import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import ApreensoesForm from "./ApreensoesForm";

export const dynamic = 'force-dynamic';

export default async function ApreensoesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <LayoutWrapper title="REGISTRO DE APREENSÕES">
      <div className="max-w-4xl">
        <ApreensoesForm 
          userId={session.user.id}
          userName={session.user.name || "Agente"}
          userIcName={session.user.icName || "Não configurado"}
        />
      </div>
    </LayoutWrapper>
  );
}
