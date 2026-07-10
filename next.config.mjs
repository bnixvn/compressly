/** @type {import('next').NextConfig} */
const nextConfig = {
  // sharp is a native module; keep it external so Next does not try to bundle it.
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
