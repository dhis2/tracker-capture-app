'use strict';
var webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
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
        baseUrl: 'https://covid19.fiks.test.ks.no',
        authorization: 'Basic NzcxMWQyOGItNGI3MS00ZmMyLWIxYzItMTFjNDYzMjMzMjQxOio0Y01JTGYkOUk5T1R1WGcyVWg=' // 7711d28b-4b71-4fc2-b1c2-11c463233241:*4cMILf$9I9OTuXg2Uh
    //authorization: 'Basic VGVzdFRvS29tbXVuZTpRUl5wZ0ZtUVY2aUI3RiZDUTRv' // TestToKommune:QR^pgFmQV6iB7F&CQ4o
    //baseUrl: 'https://covid19.fiks.dev.ks.no',
    //authorization: 'Basic c3ZlaW51bmc6ZWI4NjQyQkM4Mi0zZDRiMDc4YWE4ZA==' // sveinung:eb8642BC82-3d4b078aa8d
    // authorization: 'Basic dGwwN2I6NFgqKlZLTDAwZUYyUkFaRGluZw==' // tl07b:4X**VKL00eF2RAZDing
};
}
const fiksConfig = {
    mockApiPath: "http://localhost:4040/dhis2-mock"
};
console.log(JSON.stringify(dhisConfig, null, 2), '\n');
function bypass(req, res, opt) {
    req.headers.Authorization = dhisConfig.authorization;
}
function addFiksAuth(req, res, opt) {
    req.headers.Authorization = "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkI0Q0FFNDUyQzhCNkE4OTNCNkE4NDBBQzhDODRGQjA3MEE0MjZFNDEiLCJ4NXQiOiJ0TXJrVXNpMnFKTzJxRUNzaklUN0J3cENia0UiLCJ0eXAiOiJKV1QifQ.eyJuYmYiOjE2MTk2OTQzMjksImV4cCI6MTc3NzM3NDMyOSwiaXNzIjoiaHR0cHM6Ly9oZWxzZWlkLXN0cy50ZXN0Lm5obi5ubyIsImF1ZCI6WyJmaGk6c3lzdmFrbmV0dCIsImZoaTpwZXJzb25vcHBzbGFnIiwiZmhpOm1zaXNrbGluaWtlcm1lbGRpbmdhcGkiLCJmaGk6bGFiZGF0YWJhc2UiLCJrczpmaWtzIl0sImNsaWVudF9pZCI6IjE5Y2FjZGNmLTkxMWYtNDEyZC1hYTM1LWFhNjRkNzBmYzk2OSIsImNsaWVudF9hbXIiOiJwcml2YXRlX2tleV9qd3QiLCJzdWIiOiJMMzQ5bW1haURQN0RoVFNFcXdZSDFqU3dKVDVZMHg2b2tIN2Z6cFYyUnJrPSIsImF1dGhfdGltZSI6MTYxOTY5NDMyOSwiaWRwIjoidGVzdGlkcC1vaWRjIiwiaGVsc2VpZDovL2NsYWltcy9pZGVudGl0eS9zZWN1cml0eV9sZXZlbCI6IjQiLCJoZWxzZWlkOi8vY2xhaW1zL2lkZW50aXR5L3BpZCI6IjA1MTA1MTk0Njc4IiwiaGVsc2VpZDovL2NsYWltcy9pZGVudGl0eS9waWRfcHNldWRvbnltIjoiRThpeVUwSFdQN2F4WWNpaTczR05oemRzNWNTUFNOZitSWnVncG1vLytoTT0iLCJuYW1lIjoiSVNBQkVMTCBTQVVFIiwiZ2l2ZW5fbmFtZSI6IklTQUJFTEwiLCJtaWRkbGVfbmFtZSI6IiIsImZhbWlseV9uYW1lIjoiU0FVRSIsImhlbHNlaWQ6Ly9jbGFpbXMvY2xpZW50L2FtciI6InJzYV9wcml2YXRlX2tleSIsImhlbHNlaWQ6Ly9jbGFpbXMvY2xpZW50L2NsYWltcy9vcmducl9wYXJlbnQiOiI5NzEwMzIxNDYiLCJqdGkiOiJDQjk2QkI1NUIyRTY2MkIwODlEMDlCQkQwQkE5RkUzNiIsInNpZCI6IjExMjM1QjIyMkE2MjNBODUzREIyRUFCMThENzVDMzJBIiwiaWF0IjoxNjE5Njk0MzI5LCJzY29wZSI6WyJvcGVuaWQiLCJmaGk6bGFiZGF0YWJhc2UvZmlrcyIsImZoaTpwZXJzb25vcHBzbGFnL2FwaSIsImtzOmZpa3MvbGFiZGF0YWJhc2UiLCJrczpmaWtzL3N5c3ZhayIsImZoaTptc2lza2xpbmlrZXJtZWxkaW5nYXBpL2FwaSIsImZoaTpzeXN2YWtuZXR0L2Zpa3MvYXBpIiwiZmhpOnN5c3Zha25ldHQvYXBpIiwicHJvZmlsZSIsImhlbHNlaWQ6Ly9zY29wZXMvaHByL2hwcl9udW1iZXIiLCJoZWxzZWlkOi8vc2NvcGVzL2lkZW50aXR5L3NlY3VyaXR5X2xldmVsIiwiaGVsc2VpZDovL3Njb3Blcy9pZGVudGl0eS9waWQiLCJvZmZsaW5lX2FjY2VzcyJdLCJhbXIiOlsiZXh0ZXJuYWwiXX0.GFzoTbNinT6tldS9vbPVSa9jLi7K2b70mFVojruUrZWLGXGDb5BnIguIa2oMKeP_sHEmdsMym77B7yFSBByb8T0JpHSmh17LEgsgOdyG1NtRF-nDKDDQehcRYjWmbEYb8-ghRFWcFlFfUAp79oJLv1aEhPK64NNzEPSBNuOsf7TpBY2EPx0F6GArIALJ7HUjVtiZ_B2zCEb3WD-wSt2FozSa8-FQlRC3m2r3WWuFNdn8rYlilqOVvDzA2qjtGGrF7-A4VAsNH6EFD0Mg8mrgEWd-lJo2BjPnyXsmeClmCsVqCiCHSHzeyQRC7BjPlNbgfdRGj9Fp_Qkbauc1C1YWxQ"
    req.headers.IntegrasjonId = "039ebb25-2231-450b-b86b-cd40cc8d4888"
    req.headers.IntegrasjonPassord = "9am9zBnNVt-x*@HG*2mwo-aV3hPEFCK3-C2XT5oAQ?d-hYEc@UXTe*"
}
function makeLinkTags(stylesheets) {
    return function (hash) {
        return stylesheets
            .map(([url, attributes]) => {
                const attributeMap = Object.assign({ media: 'screen' }, attributes);
                const attributesString = Object
                    .keys(attributeMap)
                    .map(key => `${key}="${attributeMap[key]}"`)
                    .join(' ');
                return `<link type="text/css" rel="stylesheet" href="${url}?_=${hash}" ${attributesString} />`;
            })
            .join(`\n`);
    };
}
function makeScriptTags(scripts) {
    return function (hash) {
        return scripts
            .map(script => (`<script src="${script}?_=${hash}"></script>`))
            .join(`\n`);
    };
}
function createProxy(data) {
    return Object.assign(
        {
            target: dhisConfig.baseUrl,
            secure: false,
            bypass:bypass,
            changeOrigin: true
        },
        data);
}
function createTestProxy(data) {
    return Object.assign(
        {
            target: "https://api.fiks.dev.ks.no/dhis2-konfigurasjon/",
            secure: false,
            bypass: addFiksAuth,
            changeOrigin: true
        },
        data);
}
module.exports = {
    context: __dirname,
    entry: './scripts/index.js',
    output: {
        path: path.join(__dirname, '/build'),
        filename: 'app-[hash].js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: [/(node_modules)/],
                loaders: ['ng-annotate-loader', 'babel-loader'],
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(gif|png|jpg|svg)$/,
                loader: 'file-loader'
            },
        ],
        noParse: /node_modules\/leaflet-control-geocoder\/dist\/Control.Geocoder.js/,
    },
    plugins: [
        new webpack.optimize.DedupePlugin(),
        new HTMLWebpackPlugin({
            template: './index.ejs',
            stylesheets: makeLinkTags([
                ['styles/style.css'],
                ['styles/print.css', { media: 'print' }],
            ]),
            scripts: makeScriptTags([
                'core/tracker-capture.js',
                'vendor/main/main.js',
            ]),
        }),
    ],
    devtool: 'sourcemap',
    devServer: {
        contentBase: '.',
            progress: true,
            colors: true,
            port: 8081,
            inline: false,
            compress: false,
            proxy: [
            createProxy({ path: '/api/person/sok', target: fiksConfig.mockApiPath}),
            createProxy({ path: '/api/vaksine/sok', target: fiksConfig.mockApiPath}),
            createProxy({ path: '/api/provesvar/sok', target: fiksConfig.mockApiPath}),
            createProxy({ path: '/api/klinikermelding', target: fiksConfig.mockApiPath}),
            createProxy({ path: '/api/innreise/synkroniser/**', target: fiksConfig.mockApiPath}),
            createProxy({ path: '/api/naerkontakt/**', target: fiksConfig.mockApiPath}),
            createProxy({ path: '/api/import/**', target: fiksConfig.mockApiPath}),
            createProxy({ path: '/api/userSettings/keyTrackerDashboardLayout', target: fiksConfig.mockApiPath}),
            createProxy({ path: '/api/**'}),
            createProxy({ path: '/dhis/dhis-web-commons/**'}),
            createProxy({ path: '/dhis-web-commons-ajax-json/**'}),
            createProxy({ path: '/dhis-web-commons-stream/**'}),
            createProxy({ path: '/dhis-web-commons/***', proxyTimeout: 1000 * 60 * 5}),
            createProxy({ path: '/dhis-web-core-resource/**'}),
            createProxy({ path: '/icons/**'}),
            createProxy({ path: '/images/**'}),
            createProxy({ path: '/main.js'}),
        ],
    },
};
