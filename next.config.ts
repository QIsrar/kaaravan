import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Build Supabase storage remote pattern from the public env var.
// Pattern: https://<project-ref>.supabase.co/storage/v1/object/public/**
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
let supabaseHostname = "";
try {
  supabaseHostname = new URL(supabaseUrl).hostname;
} catch {
  // NEXT_PUBLIC_SUPABASE_URL not set at build time — remotePatterns will be empty.
}

const nextConfig: NextConfig = {
  images: {
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/webp", "image/avif"],
    ...(supabaseHostname
      ? {
          remotePatterns: [
            {
              protocol: "https",
              hostname: supabaseHostname,
              pathname: "/storage/v1/object/public/**",
            },
          ],
        }
      : {}),
  },
};

export default withNextIntl(nextConfig);
