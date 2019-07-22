import React, {Component} from 'react'
import './style/App.scss'

import Content from "./scenes/Content"
import UpdateCaption from "./scenes/UpdateCaption"

import api from './library/api'
import shuffle from 'shuffle-array'
import moment from 'moment-timezone'

import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

class App extends Component {
  constructor(props) {
    super(props)

    const urlParams = (new URLSearchParams(window.location.search))
    api.APIKey = urlParams.get('key')

    this.state = {
      display: false,
      support: this.detectSupport(),
      categories: urlParams.get('categories').split(',').map(Number),
      backgrounds: {},  // List of available backgrounds { categoryID: background URL }
      category: null,
      records: [],
      run: {
        length: 3,
        records: [],
        step: 0,
        timer: null
      }
    }
  }

  componentDidMount() {
    this.checkCache().then(this.updateBackgrounds).then(this.prepareDisplay)
  }

  supports = [
    {name: 'FCL', width: '3840', height: '1080', design: 'FCL'},
    {name: 'DCA', width: '1080', height: '1920', design: 'DCA'},
  ]

  detectSupport() {
    const isBroadsignPlayer = typeof window.BroadSignObject !== 'undefined'
    if (!isBroadsignPlayer) {
      console.log('This is not a BroadSign Player')
    }

    // Get the support resolution
    const supportResolution = isBroadsignPlayer
      ? window.BroadSignObject.display_unit_resolution
      : this.props.windowWidth + "x" + this.props.windowHeight

    const supportIndex = this.supports.findIndex(support => supportResolution === (support.width + "x" + support.height))

    if (supportIndex === -1) {
      const supportParameter = (new URLSearchParams(window.location.search)).get('support')
      const support = this.supports.find(s => s.name === supportParameter)
      return support !== undefined ? support : this.supports[0]
    }

    if(isBroadsignPlayer) {
      // Link the BroadSignPlay method to react
      document.getElementById('broadsign-holder')
        .addEventListener('click', this.beginDisplay)

    }

    return this.supports[supportIndex]
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

        // If we are in production, set the key.
        // if (this.state.production)
          localStorage.setItem(storageKey, d.getTime())
      })
    }

    return Promise.resolve()
  }

  updateBackgrounds = () => {
    const storageKey = 'news-dynamic.background-refresh-date'

    // Get last update date of the backgrounds
    const lastUpdate = localStorage.getItem(storageKey)

    // Get the backgrounds for the current support
    return api.getBackgrounds(this.state.support.name).then(response => {
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

      if (lastUpdate !== null || Date.now() - lastUpdate < process.env.REACT_APP_BACKGROUNDS_REFRESH_RATE) {
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

    // Load records for this category
    return api.getRecords(this.state.category).then(response => {
      // Get records and sort them from recent to oldest
      const records = response.content.records.sort((a, b) => {
        return (new Date(a.date)).getTime() > (new Date(b.date)).getTime() ? -1 : 1
      })

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
      if(records.length < this.state.run.length && this.state.support.name !== 'DCA') {
        // There is not enough records with an image, inject records without images to compensate
        records.push(...this.state.records.slice(0, this.state.run.length - records.length))
      }

      // Keep only the first 25 articles in the pool, randomize, and select the run-length first
      return this.setState({
        run: {
          ...this.state.run,
          records: shuffle(records.slice(0, 12)).slice(0, this.state.run.length)
        }
      })
    })
  }

  beginDisplay = () => {
    if(this.state.display) {
      return // Already playing
    }

    console.log(this.state)

    this.setState({
      display: true,
      run: {
        ...this.state.run,
        timer: setInterval(this.run, 10 * 1000)
      }
    })
  }

  run = () => {
    if(this.state.run.step + 1 === this.state.run.length) {
      clearInterval(this.state.run.timer)
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

    if(this.state.display) {
      const record = this.state.run.records[this.state.run.step]
      recordDate = moment.tz(record.date, "America/Montreal")
      recordID = record.id
      headline = record.headline
      media = record.path
    }

    return (
      <ReactCSSTransitionGroup
        transitionName="transition-article"
        transitionAppearTimeout={ 750 }
        transitionEnterTimeout={ 750 }
        transitionLeaveTimeout={ 750 }
        transitionAppear={ true }
        transitionEnter={ true }
        transitionLeave={ true }
        component="main"
        className={ [this.state.support.name, this.state.support.design].join(' ') }
        style={{background:"url(" + this.state.backgrounds[this.state.category] + ")"}}
        onClick={ this.beginDisplay }>
        <UpdateCaption
          articleTime={ recordDate }
          design={ this.state.support.design }
          key={ ['caption-', recordID].join() }
        />
        <Content
          headline={ headline }
          image={ media }
          design={ this.state.support.design }
          key={ ['headline-', recordID].join() }
        />
      </ReactCSSTransitionGroup>
    );
  }
}

export default App;
