import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import PrisaoForm from "./PrisaoForm";

export const dynamic = 'force-dynamic';

export default async function PrisoesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <LayoutWrapper title="PRISÕES">
      <div className="max-w-4xl">
        <PrisaoForm 
          userId={session.user.id}
          userName={session.user.name || "Agente"}
          userIcName={session.user.icName || "Não configurado"}
        />
      </div>
    </LayoutWrapper>
  );
}
