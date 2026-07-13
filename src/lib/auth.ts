import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email" } },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 0, // Força refresh do JWT em toda requisição
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !profile) return false;

      // Valida que o Discord ID é um número válido (evita IDs inválidos)
      const discordId = String((profile as any).id || "");
      if (!discordId || !/^\d+$/.test(discordId)) {
        console.error("[signIn] Discord ID inválido:", discordId);
        return false;
      }

      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: discordId },
        });

        if (!dbUser) {
          // Primeiro acesso: cria perfil com role MEMBRO e período de teste de 15 dias
          await prisma.user.create({
            data: {
              id: discordId,
              name: (profile as any).username || user.name || "Membro Discord",
              email: (profile as any).email || user.email,
              image: (profile as any).image_url || user.image || `https://cdn.discordapp.com/embed/avatars/0.png`,
              role: "MEMBRO",
              status: "EM_TESTE",
              probationEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            },
          });
        } else {
          // Acesso subsequente: atualiza APENAS metadados do Discord
          // Nunca altera: role, rank, icName, status, probationEnd
          // Proteção extra: DEV nunca tem dados alterados
          if (dbUser.role !== "DEV") {
            await prisma.user.update({
              where: { id: discordId },
              data: {
                name: (profile as any).username || user.name || dbUser.name,
                image: (profile as any).image_url || user.image || dbUser.image,
                email: (profile as any).email || user.email || dbUser.email,
              },
            });
          }
        }

        return true;
      } catch (error) {
        console.error("[signIn] Erro:", error);
        return false;
      }
    },

    async jwt({ token, account }) {
      // Na primeira chamada do JWT (login OAuth), account está disponível
      // Definimos o token.id com o Discord Snowflake ID
      if (account?.provider === "discord" && account.providerAccountId) {
        token.id = String(account.providerAccountId);
      }

      // Fallback: se token.id ainda não está definido, usa token.sub (padrão NextAuth)
      if (!token.id && token.sub) {
        token.id = token.sub;
      }

      // Sempre busca dados frescos do banco usando o Discord ID
      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: String(token.id) },
            select: {
              role: true,
              rank: true,
              icName: true,
              status: true,
            },
          });

          if (dbUser) {
            token.role = dbUser.role as "DEV" | "MEMBRO" | "LIDER" | "ADMIN";
            token.rank = dbUser.rank;
            token.icName = dbUser.icName;
            token.status = dbUser.status as "ATIVO" | "EM_TESTE" | "INATIVO" | "BANIDO";
          }
        } catch (error) {
          console.error("[jwt] Erro ao buscar usuário:", token.id, error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = String(token.id);
        session.user.role = token.role as any;
        session.user.rank = token.rank as string | null;
        session.user.icName = token.icName as string | null;
        session.user.status = token.status as any;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
