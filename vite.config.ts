import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    outDir: "docs",
  },
  assetsInclude: ["src/assets/*.hdr", "src/assets/*.glb"],
});
