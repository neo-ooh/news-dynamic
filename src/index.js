import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'

// LOCALIZATIONS
import {IntlProvider, addLocaleData} from 'react-intl'
import fr from 'react-intl/locale-data/fr'
import en from 'react-intl/locale-data/en'
import frenchMessages from './assets/locales/fr-CA'
import englishMessages from './assets/locales/en-CA'

// ENV
import {config} from 'dotenv'

config()

const messages = {
  'fr-FR': frenchMessages,
  'fr-CA': frenchMessages,
  'en-CA': englishMessages,
}

addLocaleData([...fr, ...en])

//
// GO REACT
ReactDOM.render(
  <IntlProvider
    locale={navigator.language}
    messages={messages[navigator.language]}>
    <App/>
  </IntlProvider>, document.getElementById('root'))

// Register, or not if dev, the service worker
if(process.env.REACT_APP_ENV === 'development') {
  serviceWorker.unregister();
} else {
  serviceWorker.register();
}