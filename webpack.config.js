var webpack = require('webpack');
var path = require('path');

module.exports = {
    context: __dirname,
    entry: './scripts/index.js',
    output: {
        path: path.join(__dirname, '/build'),
        filename: 'app.js',
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: [/(node_modules)/],
                loader: 'babel',
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader',
            },
        ],
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
    ],
    devtool: ['sourcemap'],
    devServer: {
        contentBase: '.',
        progress: true,
        colors: true,
        port: 8081,
        inline: true,
        proxy: {
            '/api/*': {
                target: 'http://localhost:9090/dhis/',
                rewrite: function(req) {
                    req.headers.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';
                }
            },
            '/dhis-web-commons-ajax-json/*': {
                target: 'http://localhost:9090/dhis/',
                rewrite: function(req) {
                    req.headers.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';
                }
            },
            '/dhis-web-commons-stream/*': {
                target: 'http://localhost:9090/dhis/',
                rewrite: function(req) {
                    req.headers.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';
                }
            },
            '/dhis-web-commons/*': {
                target: 'http://localhost:9090/dhis/',
                rewrite: function(req) {
                    req.headers.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';
                }
            },
            '/main.js': {
                target: 'http://localhost:9090/dhis/',
                rewrite: function(req) {
                    req.headers.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';
                }
            },
            '/icons/*': {
                target: 'http://localhost:9090/dhis/',
                rewrite: function(req) {
                    req.headers.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';
                }
            },
            '/images/*': {
                target: 'http://localhost:9090/dhis/',
                rewrite: function(req) {
                    req.headers.Authorization = 'Basic YWRtaW46ZGlzdHJpY3Q=';
                }
            }
        }
    },
};
