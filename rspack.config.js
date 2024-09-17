
import path from "path";
import rspack from "@rspack/core";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { defineConfig } from "@rspack/cli";
import { readFileSync } from "fs";

export default defineConfig(async (env, argv) => {
    const { jsc } = JSON.parse(
        readFileSync(`${import.meta.dirname}/.swcrc`, "utf-8")
      );
      const config = defineConfig({
        mode: "production",
        optimization: {
          minimize: true,
          minimizer: [
            new rspack.SwcJsMinimizerRspackPlugin({
              minimizerOptions: {
                compress: {
                  keep_classnames: true
                },
                mangle: false
              }
            })
          ]
        },
        experiments: {
          outputModule: true
        },
        devtool: "source-map",
        output: {
          filename: `${argv.entry[0].split("/").at(-1).split(".")[0]}.mjs`,
          path: "dist",
          chunkFormat: "module",
          chunkLoading: "import",
          library: {
            type: "module"
          }
        },
        stats: {},
        externals: [],
        target: "node",
        resolve: {
          extensions: [".ts", ".js"],
          tsConfig: path.resolve(import.meta.dirname, "tsconfig.json")
        },
        module: {
          rules: [
            {
              test: /\.ts$/,
              exclude: [/node_modules/],
              loader: "swc-loader",
              options: { jsc}
            }
          ]
        },
        plugins: [new CleanWebpackPlugin()]
      });
      return config;
  });
  
