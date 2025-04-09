/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const { DefinePlugin } = require("webpack");

const publicPath = process.env.BASE_PATH || "/";

/** @type { import("webpack").Configuration } */
module.exports = {
    entry: "./src/index.tsx",
    devtool: "inline-source-map",
    module: {
        rules: [
            {
                test: /\.tsx?$/i,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                include: [path.resolve(__dirname, "src")],
                use: ["style-loader", "css-loader", "postcss-loader"]
            },
            {
                test: /\.svg$/i,
                issuer: /\.[jt]sx?$/i,
                use: ["@svgr/webpack"]
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: "asset/resource"
            }
        ]
    },
    resolve: {
        plugins: [new TsconfigPathsPlugin()],
        extensions: [".tsx", ".ts", ".js"],
        mainFiles: ["index"]
    },
    output: {
        filename: "static/bundle.js",
        path: path.resolve(__dirname, "build"),
        publicPath: publicPath
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "public", "index.html")
        }),
        new DefinePlugin({
            NODE_ENV: JSON.stringify(process.env.NODE_ENV || "development"),
            BASE_PATH: JSON.stringify(publicPath)
        })
    ],
    devServer: {
        host: "localhost",
        port: 3001,
        proxy: [
            {
                context: [`${publicPath}api`],
                target: "http://127.0.0.1:3000"
            }
        ]
    },
    performance: {
        hints: false
    }
};
