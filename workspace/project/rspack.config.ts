import { defineConfig } from "@rspack/cli";
import rspack, {
  type CopyRspackPluginOptions,
  type RspackOptions,
  type SwcLoaderOptions
} from "@rspack/core";
import path from "path";
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import ESLintPlugin from "eslint-rspack-plugin";
import RefreshPlugin from "@rspack/plugin-react-refresh";
import portfinder from "portfinder";
import readline from "readline";
import { readFileSync } from "fs";

export const getSharedRspackConfig = async ({
  argv,
  swcFilePath,
  dirname,
  alias,
  moduleFederationPlugin,
  copyPluginPatterns,
  clientEntry,
  serverEntry,
  hasModuleMetadata,
  clientExternals,
  clientDisableModule,
  clientOutput,
  onlyEmitClient,
  noSplitChunks,
  onLambda
}: {
  argv: Record<string, any>;
  dirname: string;
  swcFilePath?: string;
  alias?: NonNullable<RspackOptions["resolve"]>["alias"];
  moduleFederationPlugin?: any;
  copyPluginPatterns?: CopyRspackPluginOptions["patterns"];
  hasModuleMetadata?: boolean;
  clientExternals?: RspackOptions["externals"];
  clientDisableModule?: boolean;
  clientOutput?: RspackOptions["output"];
  onlyEmitClient?: boolean;
  clientEntry?: RspackOptions["entry"];
  serverEntry?: RspackOptions["entry"];
  noSplitChunks?: boolean;
  onLambda?: boolean;
}) => {
  const { jsc }: SwcLoaderOptions = JSON.parse(
    readFileSync(swcFilePath ? swcFilePath : `${dirname}/.swcrc`, "utf-8")
  );

  console.log(path.resolve(dirname, "tsconfig.json"));

  const resolve: RspackOptions["resolve"] = {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    tsConfig: path.resolve(dirname, "tsconfig.json"),
    alias
  };

  const sharedLoaders = (
    isDev: boolean,
    isServer?: boolean
  ): NonNullable<NonNullable<RspackOptions["module"]>["rules"]> => {
    if (!isServer) {
      jsc!.target = "es2022";
    }
    if (isDev) {
      jsc!.transform!.react!.refresh = true;
    } else {
      jsc!.experimental = {
        plugins: [
          [
            "@swc/plugin-remove-console",
            {
              exclude: ["error", "info", "warn"]
            }
          ]
        ]
      };
    }
    return [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "swc-loader",
            options: {
              jsc
            }
          }
        ]
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: "@svgr/webpack",
            options: {
              svgoConfig: {
                plugins: [
                  {
                    name: "preset-default",
                    params: {
                      overrides: {
                        removeViewBox: false
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      },
      {
        test: /\.(png|jpg|gif|ico)$/,
        type: "asset",
        generator: {
          filename: "images/[name].[contenthash][ext]",
          emit: !isServer
        },
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024
          }
        }
      },
      {
        test: /\.(woff|woff2)$/,
        type: "asset/inline",
        generator: {
          filename: "fonts/[name].[contenthash][ext]",
          emit: !isServer
        }
      }
    ];
  };

  const sharedProductionPlugins = (onLambda?: boolean) => {
    return onLambda
      ? []
      : [
          new NodePolyfillPlugin(),
          new rspack.ProvidePlugin({
            Buffer: ["buffer", "Buffer"]
          })
        ];
  };

  const getClientConfig: (isDev: boolean) => Promise<RspackOptions> = async isDev => {
    const clientConfig: RspackOptions = {
      mode: isDev ? "development" : "production",
      experiments: {
        outputModule: !clientDisableModule
      },
      externals: clientExternals,
      optimization: {
        minimize: !isDev,
        minimizer: [new rspack.SwcJsMinimizerRspackPlugin({})]
      },
      target: onLambda ? "node" : "web",
      stats: { modules: false, performance: false },
      resolve,
      entry: clientEntry
        ? clientEntry
        : {
            client: `${dirname}/src/client/index.tsx`
          },
      devtool: isDev ? "source-map" : "hidden-source-map",
      module: {
        rules: [
          ...sharedLoaders(isDev),
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"]
          }
        ]
      },
      output: clientOutput
        ? clientOutput
        : {
            filename: isDev ? "[name].js" : "[name].[contenthash].mjs",
            path: path.join(dirname, "dist", "static"),
            publicPath: isDev ? "/" : undefined
          },
      plugins: [
        ...sharedProductionPlugins(onLambda),
        moduleFederationPlugin,
        onLambda
          ? undefined
          : new rspack.ProvidePlugin({
              process: "process/browser.js"
            })
      ].filter(Boolean),
      performance: {
        hints: false
      }
    };

    if (isDev) {
      clientConfig.devServer = {
        hot: true,
        port: process.env.PORT,
        historyApiFallback: true,
        open: true
      };
      clientConfig.plugins?.push(
        new ForkTsCheckerWebpackPlugin({
          formatter: {
            type: "basic",
            pathType: "absolute"
          },
          typescript: {
            memoryLimit: 8192
          }
        }),
        new ESLintPlugin({
          cache: true,
          cacheLocation: ".eslintcache",
          configType: "flat",
          extensions: ["ts", "tsx"],
          exclude: ["node_modules"]
        }),
        new RefreshPlugin()
      );
    } else {
      clientConfig.optimization = noSplitChunks
        ? clientConfig.optimization
        : {
            ...clientConfig.optimization,
            splitChunks: {
              chunks: "all",
              minSize: 3 * 1024 * 1024,
              maxSize: 5 * 1024 * 1024
            }
          };
      if (copyPluginPatterns && copyPluginPatterns.length) {
        clientConfig.plugins?.push(
          new rspack.CopyRspackPlugin({
            patterns: copyPluginPatterns
          })
        );
      }
    }
    return clientConfig;
  };

  const isDev = argv.mode !== "production";

  let port = process.env.PORT ? Number(process.env.PORT) : undefined;
  if (port) {
    portfinder.basePort = Number(process.env.PORT);
    port = await portfinder.getPortPromise();
    if (port !== portfinder.basePort) {
      if (!(await askUserForConfirmation(port))) {
        process.exit(1);
      }
      process.env.PORT = port.toString();
    }
  }

  return await getClientConfig(isDev);
};

const askUserForConfirmation = (port: number) => {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(
      `Port ${portfinder.basePort} is in use. Do you want to use port ${port} instead? (y/n): `,
      answer => {
        rl.close();
        resolve(answer.trim().toLowerCase() === "y");
      }
    );
  });
};

export default defineConfig(async (env, argv) =>
  getSharedRspackConfig({
    argv,
    dirname: import.meta.dirname,
    swcFilePath: `${import.meta.dirname}/../../.swcrc`,
    copyPluginPatterns: [
      {
        from: path.resolve(
          import.meta.dirname,
          process.env.COUNTRY === "NZ" ? "public/images/email-nz" : "public/images/email-au"
        ),
        to: path.resolve(import.meta.dirname, "dist/static/email")
      },
      {
        from: path.resolve(import.meta.dirname, "public/robots.txt"),
        to: path.resolve(import.meta.dirname, "dist/static/robots.txt")
      }
    ]
  })
);
