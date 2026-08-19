import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prefeitura Conecta",
    short_name: "Prefeitura",
    description: "Plataforma integrada de gestão municipal.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7f6",
    theme_color: "#176f65",
    lang: "pt-BR",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
