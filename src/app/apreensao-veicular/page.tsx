import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import ApreensaoVeicularForm from "./ApreensaoVeicularForm";

export const dynamic = 'force-dynamic';

export default async function ApreensaoVeicularPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <LayoutWrapper title="APREENSÃO VEICULAR">
      <div className="max-w-4xl">
        <ApreensaoVeicularForm 
          userId={session.user.id}
          userName={session.user.name || "Agente"}
          userIcName={session.user.icName || "Não configurado"}
        />
      </div>
    </LayoutWrapper>
  );
}
