import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";

// A function so the mode picked on the command line can steer the rest:
// `webpack serve` runs in development with eval source maps for fast
// rebuilds, while `npm run build` passes --mode production and ships a
// minified bundle with no maps (eval maps alone made the deployed bundle
// about 6x larger).
export default (env, argv) => {
  const production = argv.mode === "production";

  return {
    mode: production ? "production" : "development",
    entry: "./src/index.js",
    output: {
      // Hashed so a deploy is picked up immediately: GitHub Pages caches
      // files for 10 minutes, and a new name sidesteps that cache.
      // HtmlWebpackPlugin injects whatever the name turns out to be.
      filename: production ? "[name].[contenthash].js" : "[name].js",
      path: path.resolve(import.meta.dirname, "dist"),
      clean: true,
    },
    devtool: production ? false : "eval-source-map",
    devServer: {
      watchFiles: ["./src/template.html"],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/template.html",
      }),
    ],
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|webp)$/i,
          type: "asset/resource",
        },
      ],
    },
  };
};
