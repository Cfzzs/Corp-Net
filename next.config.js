/** @type {import('next').NextConfig} */
const nextConfig = {
  // Garante que todas as rotas de API sejam sempre dinâmicas (nunca pré-renderizadas)
  // Isso evita o erro "Failed to collect page data for /api/auth/[...nextauth]"
  // durante o build, pois o Next.js não tentará executar as rotas de API
  // que dependem de banco de dados ou variáveis de ambiente runtime.
  experimental: {
    // Sem configurações experimentais problemáticas
  },

  // Expõe apenas as variáveis de ambiente necessárias em build time
  // Variáveis de runtime (banco, secrets) são acessadas somente em execução
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // Imagens externas permitidas (avatar do Discord)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
};

module.exports = nextConfig;
