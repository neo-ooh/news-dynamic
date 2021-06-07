// Log Aggregation
import { init as initApm } from '@elastic/apm-rum';

// ENV
import { config as dotenvConfig } from 'dotenv';
import React                      from 'react';
import ReactDOM                   from 'react-dom';
import App                        from './App';

import ErrorBoundary from './scenes/ErrorBoundary';

import * as serviceWorker from './serviceWorker';

// Init APM for User Experience Tracking
initApm({
  // Set required service name (allowed characters: a-z, A-Z, 0-9, -, _, and space)
  serviceName   : 'news-dynamic',
  serviceVersion: process.env.REACT_APP_GIT_SHA,

  // Set custom APM Server URL (default: http://localhost:8200)
  serverUrl       : 'https://metrics.neo-ooh.info/',
  verifyServerCert: false,

  // Set service version (required for sourcemap feature)
  environment: process.env.NODE_ENV,

  breakdownMetrics: true,
});

dotenvConfig();

//
// GO REACT
ReactDOM.render(
  <ErrorBoundary>
    <App/>
  </ErrorBoundary>, document.getElementById('root'));

// Register, or not if dev, the service worker
if (process.env.REACT_APP_ENV === 'development') {
  serviceWorker.unregister();
} else {
  serviceWorker.register();
}
