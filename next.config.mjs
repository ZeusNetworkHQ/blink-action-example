// next.config.mjs
const nextConfig = {
    webpack: (config, options) => {
        if (options.nextRuntime === 'edge') {
            config.resolve.fallback = {
              ...config.resolve.fallback,
              crypto: 'crypto-browserify',
              stream: 'stream-browserify',
                buffer: 'buffer',
                http: 'stream-http',
                https: 'https-browserify',
                os: 'os-browserify/browser',
                assert: 'assert',
                url: 'url',
                vm: 'vm-browserify',
            };
          }
          return config;
    },
    async headers() {
      return [
        {
          source: '/api/:path*',
          headers: [
            { key: 'Access-Control-Allow-Credentials', value: 'true' },
            { key: 'Access-Control-Allow-Origin', value: '*' },
            { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
            { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          ],
        },
      ];
    },
  };
  
    export default nextConfig;
  