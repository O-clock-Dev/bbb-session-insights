/** @type {import('next').NextConfig} */
const os = import("node:os");
const nextConfig = {
    output: "standalone",
    basePath: "/dashboards",
    /*webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
        config.module.rules.push({
            test: /\.node$/,
            use: [
                {
                    loader: "nextjs-node-loader",
                    options: {
                        flags: os.constants.dlopen.RTLD_NOW,
                        outputPath: config.output.path,
                    },
                },
            ],
        });

        return config;
    },*/
};

export default nextConfig;
