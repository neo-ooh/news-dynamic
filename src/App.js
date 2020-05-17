import React, {Component} from 'react'
import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

import './style/App.scss'

import Content from "./scenes/Content"
import UpdateCaption from "./scenes/UpdateCaption"

import api from './library/api'
import {cache} from 'dynamics-utilities'
import shuffle from 'shuffle-array'
import moment from 'moment-timezone'

import {resolveDesign, BroadSignActions, BroadSignData} from 'dynamics-utilities'



// LOCALIZATION
import {addLocaleData, IntlProvider} from 'react-intl'
import fr from 'react-intl/locale-data/fr'
import en from 'react-intl/locale-data/en'
import frenchMessages from './assets/locales/fr-CA'
import englishMessages from './assets/locales/en-CA'

import TimeDisplay from './scenes/TimeDisplay'
import PMPHeadlineBar from './scenes/PMPHeadlineBar'
import SHDHeadlineBar from './scenes/SHDElements'

const locales = {
  'fr': frenchMessages,
  'en': englishMessages,
}

const categoriesLocales = {
  '1': 'en',
  '2': 'en',
  '3': 'en',
  '4': 'en',
  '5': 'en',
  '6': 'en',
  '7': 'fr',
  '8': 'fr',
  '9': 'fr',
}

addLocaleData([...fr, ...en])

class App extends Component {
  constructor(props) {
    super(props)

    //Link broadsign
    document.getElementById('broadsign-holder').addEventListener('click', this.beginDisplay)

    cache.setCacheName(process.env.REACT_APP_CACHE_NAME)

    const urlParams = (new URLSearchParams(window.location.search))
    api.APIKey = urlParams.get('key')

    const design = resolveDesign((new URLSearchParams(window.location.search)).get('design') || (new URLSearchParams(window.location.search)).get('support'), 'FCL')
    let headlineDisplayDuration = Number(urlParams.get('duration') || (design.name === 'SHD' ? 7.5 : 10)) * 1000

    this.state = {
      display: false,
      design: design,
      categories: urlParams.get('categories').split(',').map(Number),
      backgrounds: {},  // List of available backgrounds { categoryID: background URL }
      category: null,
      categoryURL: null,
      records: [],
      onlyPictures: false,
      run: {
        duration: headlineDisplayDuration,
        length: (BroadSignData.displayDuration() || 30000) / headlineDisplayDuration,
        records: [],
        mediaURLs: {},
        step: 0,
        timer: null
      }
    }

    if(this.state.design !== 'FCL') {
      this.state.onlyPictures = true
    }
  }

  componentDidMount() {
    this.checkCache().then(this.updateBackgrounds).then(this.prepareDisplay)
  }

  checkCache() {
    const storageKey = 'news-dynamic.cache-cleanup-date'
    // Check cache state and erase if new day
    const lastUpdate = localStorage.getItem(storageKey)

    if (lastUpdate === null || Date.now() - lastUpdate > process.env.REACT_APP_FULL_CACHE_REFRESH_RATE) {
      // Cache is too old
      return caches.delete(process.env.REACT_APP_CACHE_NAME).then(() => {
        // Set the refresh date as midnight to prevent slipping
        let d = new Date();
        d.setHours(0, 0, 0, 0)

        // Set the refresh key.
        localStorage.setItem(storageKey, d.getTime())
      })
    }

    return Promise.resolve()
  }

  updateBackgrounds = () => {
    if(this.state.design.name === 'PMP') {
      return
    }

    const storageKey = 'news-dynamic.background-refresh-date'

    // Get last update date of the backgrounds
    const lastUpdate = localStorage.getItem(storageKey)

    // Get the backgrounds for the current support
    return api.getBackgrounds(this.state.design.name).then(response => {
      const backgroundsList = {}
      const backgroundsUrls = []
      // Store only backgrounds for the current categories
      response.content.forEach(bckg => {
        if (this.state.categories.includes(bckg.category.id)) {
          // Add to cache
          const path = bckg.path.replace(/\\\//g, "/")
          backgroundsList[bckg.category.id] = path
          backgroundsUrls.push(path)
        }
      })

      // Add them to the state
      this.setState({
        backgrounds: backgroundsList
      })

      if (lastUpdate !== null || Date.now() - lastUpdate > process.env.REACT_APP_BACKGROUNDS_REFRESH_RATE) {
        // No need to refresh the backgrounds
        return
      }

      // Backgrounds needs to be refreshed.
      caches.open(process.env.REACT_APP_CACHE_NAME).then(cache => {
        cache.addAll(backgroundsUrls)

        localStorage.setItem(storageKey, Date.now().toString())
      })
    })
  }

  prepareDisplay = () => {
    // set category to display
    const category = this.state.categories.length > 1 ?
      this.state.categories[Math.floor(Math.random() * this.state.categories.length)] :
      this.state.categories[0]

    this.setState({
      category: category
    })

    if(this.state.design.name !== 'PMP' && this.state.design.name !== 'SHD' && this.state.design.name !== 'PHD') {
      // prepare category background url
      cache.getImage(this.state.backgrounds[this.state.category]).then(url =>
        this.setState({
          categoryURL: url
        })
      )
    }


    // Load records for this category
    return api.getRecords(this.state.category).then(response => {
      // Get records and sort them from recent to oldest
      let records = response.content
        .reduce((acc, subj) => [...acc, ...subj.records], [])
        .sort((a, b) => {
          return (new Date(a.date)).getTime() > (new Date(b.date)).getTime() ? -1 : 1
        }).filter(record => {
          // filter records here as there will be some that will never be displayed
          const recordAge = moment.duration(Math.abs(moment().diff(moment.tz(record.date, "America/Montreal"))))
          return record.media || recordAge.asHours() < 6
        })

      // If the current design is FCL or SHD/PHD, we only display records with a horizontal media
      if (this.state.design.name === 'FCL' || this.state.design.name === 'SHD' || this.state.design.name === 'PHD') {
        records = records.filter(record => record.media ? record.media_width > record.media_height : true)
      }

      return this.setState({
        records: records,
        recordsWithMedia: records.filter(record => record.media !== null)
      }, () => {
        // Load the records medias
        const mediaUrls = this.state.recordsWithMedia
          .map(record => record.path)
          .map(path => path.replace(/\\\//g, "/"))

        return caches.open(process.env.REACT_APP_CACHE_NAME).then(cache =>
          cache.keys().then(keys => {
            const keysUrls = keys.map(key => key.url)
            mediaUrls.forEach(url => {
              if (!keysUrls.includes(url)) {
                cache.add(url)
              }
            })
          })
        )
      })
    }).then(() => {
      // Select the record to display
      let records = this.state.recordsWithMedia

      // filter records to only use ones with images
      if (records.length < this.state.run.length && !this.state.onlyPictures) {
        // There is not enough records with an image, inject records without images to compensate
        records.push(...this.state.records.slice(0, this.state.run.length - records.length))
      }

      let selectedRecords = shuffle(records.slice(0, 12)).slice(0, this.state.run.length)

      if(selectedRecords.length === 0) {
        // No records to display, skip display
        BroadSignActions.skipDisplay();
      }

      // Get the media url from the cache
      selectedRecords.forEach((record, index) => {
        if (record.media === null)
          return // Do nothing if there is no media

        cache.getImage(record.path.replace(/\\\//g, "/")).then(url => {
          this.setState({
            run: {
              ...this.state.run,
              mediaURLs: {
                ...this.state.run.mediaURLs,
                [index]: url
              }
            }
          })
        })
      })

      // Keep only the first 25 articles in the pool, randomize, and select the run-length first
      return this.setState({
        run: {
          ...this.state.run,
          records: selectedRecords
        }
      })
    })
  }

  beginDisplay = () => {
    if (this.state.display) {
      return // Already playing
    }

    // Is there anything to show ?
    if (this.state.run.records.length === 0) {
      // No, tell broadsign to stop here as this is not normal behaviour
      BroadSignActions.stopDisplay()
      console.warn('No records to display, stopping here')
      return
    }

    this.setState({
      display: true,
      run: {
        ...this.state.run,
        timer: setInterval(this.run, this.state.run.duration)
      }
    })
  }

  run = () => {
    // Is there another records to display ?
    if (this.state.run.step + 1 >= this.state.run.records.length) {
      clearInterval(this.state.run.timer)

      // Are we stopping after the requested number of records ?
      if (this.state.run.step + 1 < this.state.run.length) {
        // No, tell BroadSign to stop here as this is not normal behaviour
        BroadSignActions.stopDisplay()
        console.warn('No records left to display (' + this.state.run.step + ' instead of ' + this.state.run.length + '), stopping here')
        return
      }

      return this.setState({
        run: {
          ...this.state.run,
          timer: null
        }
      })
    }

    this.setState({
      run: {
        ...this.state.run,
        step: this.state.run.step + 1
      }
    })
  }

  render() {
    let recordDate = null, headline = null, media = null, recordID = null

    if (this.state.display) {
      const record = this.state.run.records[this.state.run.step]
      recordDate = moment.tz(record.date, "America/Montreal")
      recordID = record.id
      headline = record.headline
      media = record.media ? this.state.run.mediaURLs[this.state.run.step] : null
    }

    const locale = this.state.category ? categoriesLocales[this.state.category] : 'en'

    return (
      <IntlProvider
        messages={ locales[locale] }
        locale={ locale }>
        <ReactCSSTransitionGroup
          transitionName="transition-article"
          transitionAppearTimeout={ 750 }
          transitionEnterTimeout={ 750 }
          transitionLeaveTimeout={ 750 }
          transitionAppear={ true }
          transitionEnter={ true }
          transitionLeave={ true }
          component="main"
          className={ this.state.design.name }
          style={ {
            backgroundImage: this.state.categoryURL ? "url(" + this.state.categoryURL + ")" : "",
            transform: "scale(" + this.state.design.scale + ")"
          } }
          onClick={ this.beginDisplay }>
          {
            this.state.design.name === 'PMP' &&
            <PMPHeadlineBar />
          }
          {
            (this.state.design.name === 'SHD' || this.state.design.name === 'PHD') &&
            <SHDHeadlineBar category={ this.state.category } />
          }
          {
            (this.state.design.name !== 'SHD' || this.state.design.name !== 'PHP') &&
            <TimeDisplay design={ this.state.design.name }/>
          }
          <UpdateCaption
            articleTime={ recordDate }
            design={ this.state.design.name }
            key={ ['caption-', recordID].join() }
          />
          <Content
            headline={ headline }
            image={ media }
            background={ this.state.categoryURL }
            design={ this.state.design.name }
            key={ ['headline-', recordID].join() }
            category={ this.state.category }
          />
        </ReactCSSTransitionGroup>
      </IntlProvider>
    );
  }
}

export default App;
