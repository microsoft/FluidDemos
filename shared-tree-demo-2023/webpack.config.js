/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    // Basic configuration
    entry: './src/index.tsx',
    // Necessary in order to use source maps and debug directly TypeScript files
    devtool: 'source-map',
    module: {
        rules: [
            // Necessary in order to use TypeScript
            {
                test: /\.ts$|tsx/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.scss$/,
                use: [
                    // { loader: 'style-loader' },
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader'
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                            // options...
                        }
                    }
                ]
            },
            { test: /\.css$/, loader: "style-loader!css-loader" }
        ],
    },
    resolve: {
        // Alway keep '.js' even though you don't use it.
        // https://github.com/webpack/webpack-dev-server/issues/720#issuecomment-268470989
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        // This line is VERY important for VS Code debugging to attach properly
        // Tamper with it at your own risks
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    },
    plugins: [
        // No need to write a index.html
        new HtmlWebpackPlugin({
            title: 'Shared-Tree-Demo',
            favicon: 'favicon.ico',
        }),
        // Load environment variables during webpack bundle
        new Dotenv({
            systemvars: true,
        }),
        // Extract CSS to separate file
        new MiniCssExtractPlugin({
            filename: 'css/mystyles.css'
        }),
        // Do not accumulate files in ./dist
        new CleanWebpackPlugin(),        
    ],
    devServer: {
        // webpack-dev-server configuration
        contentBase: path.join(__dirname, 'dist'),
        // keep port in sync with VS Code launch.json
        port: 3000,
        // Hot-reloading, the sole reason to use webpack here <3
        hot: true,
        writeToDisk: true,
    },
}
