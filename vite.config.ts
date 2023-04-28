import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base: env.BASE ?? "/",
    build: {
      outDir: "docs",
    },
    assetsInclude: ["src/assets/*.hdr", "src/assets/*.glb"],
  };
});
