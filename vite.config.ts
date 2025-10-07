import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // GitHub Pages base URL - Change this if you rename the repository or use a custom domain
  // For GitHub Pages: '/REPOSITORY-NAME/' (e.g., '/LEADS-CRM/')
  // For custom domain: '/'
  // Repository: https://github.com/Handock-max/LEADS-CRM
  base: '/LEADS-CRM/',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
