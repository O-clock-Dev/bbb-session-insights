/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    basePath: "/dashboards",
    eslint: {
      // Ajout de la configuration pour ignorer les erreurs ESLint pendant le build
      ignoreDuringBuilds: true,
    },
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
  