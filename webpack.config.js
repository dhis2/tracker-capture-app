'use strict';

var webpack = require('webpack');
var path = require('path');
var colors = require('colors');

const dhisConfigPath = process.env.DHIS2_HOME && `${process.env.DHIS2_HOME}/config.json`;
let dhisConfig;

try {
    dhisConfig = require(dhisConfigPath);
    console.log('\nLoaded DHIS config:');
} catch (e) {
    // Failed to load config file - use default config
    console.warn('\nWARNING! Failed to load DHIS config:', e.message);
    console.info('Using default config');
    dhisConfig = {
        baseUrl: 'http://localhost:8080',
        authorization: 'Basic YWRtaW46ZGlzdHJpY3Q=' // admin:district
    };
}
console.log(JSON.stringify(dhisConfig, null, 2), '\n');

function bypass(req, res, opt) {
    req.headers.Authorization = dhisConfig.authorization;
}

module.exports = {
    context: __dirname,
    entry: './scripts/index.js',
    output: {
        path: path.join(__dirname, '/build'),
        filename: 'app.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: [/(node_modules)/],
                loader: 'babel'
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            }
        ] 
    },
    plugins: [
        new webpack.optimize.DedupePlugin()
    ],
    devtool: ['sourcemap'],
    devServer: {
        contentBase: '.',
        progress: true,
        colors: true,
        port: 8081,
        inline: false,
        compress: false,
        proxy: 
            [
                { path: '/api/**', target: dhisConfig.baseUrl, bypass:bypass },
                { path: '/dhis-web-commons-ajax-json/**', target: dhisConfig.baseUrl, bypass:bypass },
                { path: '/dhis-web-commons-stream/**', target: dhisConfig.baseUrl, bypass:bypass },
                { path: '/dhis-web-commons/**', target: dhisConfig.baseUrl, bypass:bypass },
                { path: '/icons/**', target: dhisConfig.baseUrl, bypass:bypass },
                { path: '/images/**', target: dhisConfig.baseUrl, bypass:bypass },
                { path: '/main.js', target: dhisConfig.baseUrl, bypass:bypass }
            ]
    }
};
