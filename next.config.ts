import type { NextConfig } from "next";

// Hostinger reemplaza los archivos mientras algunos navegadores todavía tienen
// rutas y assets del build anterior en memoria. Un identificador por build hace
// que Next fuerce una navegación completa ante esa diferencia de versiones.
const deploymentId =
  process.env.NEXT_DEPLOYMENT_ID ?? new Date().toISOString().replace(/[^A-Za-z0-9_-]/g, "_");

const nextConfig: NextConfig = {
  deploymentId,
  experimental: {
    // El entorno de despliegue tiene memoria limitada durante el prerender.
    // Un worker evita que el build agote la memoria al recopilar rutas.
    cpus: 1,
    // Hostinger termina TLS y reenvía las Server Actions. Limitamos la
    // excepción de origen al host público que sirve la vidriera.
    serverActions: {
      allowedOrigins: ["darkseagreen-gaur-344770.hostingersite.com"],
    },
  },
};

export default nextConfig;
