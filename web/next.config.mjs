import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js"

/** @type {import('next').NextConfig} */
const nextConfig =  (phase) => {
    const isDev = phase === PHASE_DEVELOPMENT_SERVER
    return {
        assetPrefix: isDev ? undefined : 'https://map.midwestbahai.org',
        output: 'export',
    }
}

export default nextConfig

// const nextConfig = {
//     // static build
//     // https://nextjs.org/docs/pages/building-your-application/deploying/static-exports
//     output: 'export',
// };
//
// export default nextConfig;
