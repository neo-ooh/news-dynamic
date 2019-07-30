import React from 'react'
import ReactDOM from 'react-dom'

import ErrorBoundary from './scenes/ErrorBoundary'
import App from './App'

import * as serviceWorker from './serviceWorker'

// ENV
import {config} from 'dotenv'
config()

//
// GO REACT
ReactDOM.render(
  <ErrorBoundary>
    <App/>
  </ErrorBoundary>, document.getElementById('root'))

// Register, or not if dev, the service worker
if(process.env.REACT_APP_ENV === 'development') {
  serviceWorker.unregister();
} else {
  serviceWorker.register();
}