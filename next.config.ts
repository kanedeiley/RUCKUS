import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project so Turbopack doesn't try to
  // infer it from an unrelated lockfile elsewhere in the home directory.
  turbopack: {
    root: path.join(__dirname),
  },
  // Don't auto-generate AGENTS.md/CLAUDE.md on every dev start.
  agentRules: false,


  allowedDevOrigins: ['192.168.1.86'],
};

export default nextConfig;
