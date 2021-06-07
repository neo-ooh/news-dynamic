const { addWebpackPlugin, override } = require( 'customize-cra');
const ElasticAPMSourceMapPlugin = require('elastic-apm-sourcemap-webpack-plugin').default;

const PUBLIC_PATH = '/';

module.exports = override(
  addWebpackPlugin(new ElasticAPMSourceMapPlugin({
    serviceName : 'news-dynamic',
    serviceVersion     : process.env.REACT_APP_GIT_SHA,
    serverURL : `https://metrics.neo-ooh.info/assets/v1/sourcemaps`,
    publicPath  : PUBLIC_PATH,
    secret : process.env.REACT_APP_APM_API_KEY,
    logLevel: 'warn',
    ignoreErrors: 'true'
  })),
);

