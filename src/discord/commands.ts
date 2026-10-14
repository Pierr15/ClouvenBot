export const BASIC_COMMANDS = [
  { name: "help", description: "Lihat bantuan ClouvenBot." },
  { name: "health", description: "Periksa status layanan ClouvenBot." },
  { name: "version", description: "Lihat versi ClouvenBot." }
] as const;

export function commandReply(name: string): { content: string; ephemeral?: boolean } {
  switch (name) {
    case "help":
      return {
        content: [
          "**ClouvenBot · Bantuan**",
          "• `/help` · Menampilkan bantuan.",
          "• `/health` · Memeriksa status layanan bot.",
          "• `/version` · Menampilkan versi bot.",
          "",
          "Integrasi ClouvenTwo dan perintah administratif belum diaktifkan pada MVP awal."
        ].join("\n"),
        ephemeral: true
      };
    case "health":
      return { content: "✅ ClouvenBot menerima interaksi dan berjalan.", ephemeral: true };
    case "version":
      return { content: "ClouvenBot v0.1.0 · MVP", ephemeral: true };
    default:
      return { content: "Perintah belum dikenal. Gunakan `/help`.", ephemeral: true };
  }
}