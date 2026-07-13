import DefaultSession, { DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "MEMBRO" | "LIDER" | "ADMIN" | "DEV";
      rank: string | null;
      icName: string | null;
      status: "ATIVO" | "EM_TESTE" | "DEMITIDO";
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: "MEMBRO" | "LIDER" | "ADMIN" | "DEV";
    rank: string | null;
    icName: string | null;
    status: "ATIVO" | "EM_TESTE" | "DEMITIDO";
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "MEMBRO" | "LIDER" | "ADMIN" | "DEV";
    rank: string | null;
    icName: string | null;
    status: "ATIVO" | "EM_TESTE" | "DEMITIDO";
  }
}
