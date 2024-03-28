/** @type {import('next').NextConfig} */
const os = require("node:os");
const nextConfig = {
  output: "standalone",
};

module.exports = {
  output: "standalone",
  webpack: (config, { dev, isServer, webpack, nextRuntime }) => {
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
  },
};
