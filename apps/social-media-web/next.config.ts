import type { NextConfig } from "next";

// Windows disallows symlinks in many environments, which breaks Next's
// standalone output (it tries to symlink traced deps). Only enable standalone
// when the OS supports it.
const isWindows = process.platform === "win32";

const nextConfig: NextConfig = {
  ...(isWindows ? {} : { output: "standalone" }),
  /* config options here */
};

export default nextConfig;
