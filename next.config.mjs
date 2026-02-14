/** @type {import('next').NextConfig} */
const nextConfig = {
    // Server actions are enabled by default in Next.js 14+
    turbopack: {
        root: process.cwd(),
    },
    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "date-fns",
            "lodash",
            "@radix-ui/react-icons",
            "recharts",
            "autoprefixer"
        ],
    },
};

export default nextConfig;
