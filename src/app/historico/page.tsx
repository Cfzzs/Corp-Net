import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LayoutWrapper } from "@/components/layout-wrapper";
import HistoricoSearch from "./HistoricoSearch";

export const dynamic = 'force-dynamic';

export default async function HistoricoPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  return (
    <LayoutWrapper title="HISTÓRICO CRIMINAL">
      <div className="max-w-4xl">
        <HistoricoSearch />
      </div>
    </LayoutWrapper>
  );
}
