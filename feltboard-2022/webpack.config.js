/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const mode = process.env.FLUID_CLIENT === 'azure' ? 'production' : 'development';

module.exports = {
    // Basic configuration
    entry: './src/index.tsx',
    // Necessary in order to use source maps and debug directly TypeScript files
    devtool: 'source-map',
    mode: mode,
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
        ],
    },
    resolve: {
        // Alway keep '.js' even though you don't use it.
        // https://github.com/webpack/webpack-dev-server/issues/720#issuecomment-268470989
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            buffer: require.resolve("buffer/") // note: the trailing slash is important!
        },
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
            title: 'Felt',
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
        // Copy assets to serve them
        new CopyPlugin({
            patterns: [
                { from: 'assets', to: 'assets' },
            ]
        }),
    ],
    devServer: {
        devMiddleware: {
            writeToDisk: true,
        },
        hot: true,
        port: 3000,
        static: {
            directory: path.resolve(__dirname, 'dist'),
        },
    },
    performance: {
        hints: false, // enum
        maxAssetSize: 6000000, // int (in bytes),
        maxEntrypointSize: 6000000, // int (in bytes)
        assetFilter: function(assetFilename) {
          // Function predicate that provides asset filenames
          return assetFilename.endsWith('.css') || assetFilename.endsWith('.js');
        }
      },
}
