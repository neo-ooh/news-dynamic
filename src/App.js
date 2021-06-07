import { apm, withTransaction }            from '@elastic/apm-rum-react';
import { BroadSignActions, BroadSignData } from 'dynamics-utilities';
import { Cache }                           from 'dynamics-utilities/src/library/Cache';
import { Context }                         from 'dynamics-utilities/src/library/Context';
import moment                              from 'moment-timezone';
import React, { Component }                from 'react';
import ReactCSSTransitionGroup             from 'react-addons-css-transition-group';

// LOCALIZATION
import { IntlProvider } from 'react-intl';
import englishMessages  from './assets/locales/en-CA';
import frenchMessages   from './assets/locales/fr-CA';

import API    from './library/api';
import routes from './library/routes';

import Content        from './scenes/Content';
import PMPHeadlineBar from './scenes/PMPHeadlineBar';
import SHDHeadlineBar from './scenes/SHDElements';

import TimeDisplay   from './scenes/TimeDisplay';
import UpdateCaption from './scenes/UpdateCaption';

import './style/App.scss';

const locales = {
  'fr': frenchMessages,
  'en': englishMessages,
};

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
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
};

class App extends Component {
  constructor(props) {
    super(props);

    //Link broadsign
    document.getElementById('broadsign-holder').addEventListener('click', this.beginDisplay);

    const ctx    = new Context();
    const design = ctx.getSupport('HD');

    this.api = new API(process.env.REACT_APP_API_URL, ctx.getParam('key'));

    let headlineDisplayDuration = Number(ctx.getParam('duration') || (design.name === 'SHD' ? 7.5 : 10)) * 1000;

    this.state = {
      ctx         : ctx,
      apiToken    : ctx.getParam('key'),
      display     : false,
      design      : design,
      categories  : ctx.getParam('categories').split(',').map(Number),
      network     : ctx.getParam('network') || 'shopping',
      backgrounds : {},  // List of available backgrounds { categoryID: background URL }
      category    : null,
      categoryURL : null,
      records     : [],
      onlyPictures: false,
      run         : {
        duration : headlineDisplayDuration,
        length   : (BroadSignData.displayDuration() || 30000) / headlineDisplayDuration,
        records  : [],
        mediaURLs: {},
        step     : 0,
        timer    : null,
      },
    };

    if (this.state.design !== 'FCL') {
      this.state.onlyPictures = true;
    }
  }

  componentDidMount() {
    this.checkCache()
        .then(this.updateBackgrounds)
        .finally(this.prepareDisplay)
        .then(() => {
          if (this.state.ctx.getPlayer() !== 'broadsign') {
            this.beginDisplay();
          }
        });
  }

  checkCache() {
    const storageKey = 'news-dynamic.cache-cleanup-date';
    // Check cache state and erase if new day
    const lastUpdate = localStorage.getItem(storageKey);

    if (lastUpdate === null || Date.now() - lastUpdate > process.env.REACT_APP_FULL_CACHE_REFRESH_RATE) {
      // Cache is too old
      return caches.delete(process.env.REACT_APP_CACHE_NAME).then(() => {
        // Set the refresh date as midnight to prevent slipping
        let d = new Date();
        d.setHours(0, 0, 0, 0);

        // Set the refresh key.
        localStorage.setItem(storageKey, d.getTime());
      });
    }

    return Promise.resolve();
  }

  updateBackgrounds = () => {
    if (this.state.design.name === 'PMP') {
      return;
    }

    const transaction = apm.startTransaction('background-update', 'app-setup-step');

    let design = this.state.design.name;

    if (design === 'DCA' && this.state.network === 'fitness') {
      design = 'DCF';
    }

    const storageKey = 'news-dynamic.background-refresh-date';

    // Get last update date of the backgrounds
    const lastUpdate = localStorage.getItem(storageKey);

    // Get the backgrounds for the current support
    /**
     * @var {Request} backgroundsRequest
     */
    const backgroundsRequest = this.api.prepareRoute(routes.backgrounds.list, {
      network   : this.state.ctx.getParam('network'),
      format_id : this.state.ctx.getParam('format_id'),
      categories: this.state.categories,
    });

    transaction.mark('request-backgrounds-list');
    return fetch(backgroundsRequest).then(async response => {
      const backgroundsList = {};
      const backgroundsUrls = [];

      const resp = await response.json();

      // Store only backgrounds for the current categories
      resp.content.forEach(bckg => {
        if (this.state.categories.includes(bckg.category.id)) {
          // Add to cache
          const path                        = bckg.path.replace(/\\\//g, '/');
          backgroundsList[bckg.category.id] = path;
          backgroundsUrls.push(path);
        }
      });

      // Add them to the state
      this.setState({
        backgrounds: backgroundsList,
      });

      if (lastUpdate !== null || Date.now() - lastUpdate > process.env.REACT_APP_BACKGROUNDS_REFRESH_RATE) {
        // No need to refresh the backgrounds

        transaction.end();
        return;
      }

      // Backgrounds needs to be refreshed.
      caches.open(process.env.REACT_APP_CACHE_NAME).then(async cache => {
        transaction.mark('start-fetching-backgrounds');
        await cache.addAll(backgroundsUrls.map(url => this.api.prepareUrl(url)));
        transaction.mark('backgrounds-fetching-done');

        localStorage.setItem(storageKey, Date.now().toString());
      }).finally(() => transaction.end());
    });
  };

  prepareDisplay = async () => {
    const transaction = apm.startTransaction('prepare-display', 'app-setup-step');
    // set category to display
    const category    = this.state.categories.length > 1 ?
                        this.state.categories[Math.floor(Math.random() * this.state.categories.length)] :
                        this.state.categories[0];

    this.setState({
      category: category,
    });

    const cache = (new Cache(process.env.REACT_APP_CACHE_NAME));

    if (this.state.design.name !== 'PMP' && this.state.design.name !== 'SHD' && this.state.design.name !== 'PHD') {

      const backgroundSpan = transaction.startSpan('background-loading');
      // prepare category background url
      cache.get(this.state.backgrounds[this.state.category], (url) => fetch(this.api.prepareUrl(url)))
           .then(response => response.blob())
           .then(blob => URL.createObjectURL(blob))
           .then(blobUrl => {
               backgroundSpan.end();
               this.setState({
                 categoryURL: blobUrl,
               });
             },
           );
    }

    const recordsSpan = transaction.startSpan('records-fetching')
    // Load records for this category
    const recordsRequest = this.api.prepareRoute(routes.records.list, {
      category: this.state.category,
    });

    return fetch(recordsRequest).then(async (response) => {
      // Get records and sort them from recent to oldest
      let records = (await response.json())
        .content
        .sort((a, b) => {
          return (new Date(a.date)).getTime() > (new Date(b.date)).getTime() ? -1 : 1;
        }).filter(record => {
          // filter records here as there will be some that will never be displayed
          const recordAge = moment.duration(Math.abs(moment().diff(moment.tz(record.date, 'America/Montreal'))));
          return record.media || recordAge.asHours() < 6;
        });

      // If the current design is FCL or SHD/PHD, we only display records with a horizontal media
      if (this.state.design.name === 'FCL' || this.state.design.name === 'SHD' || this.state.design.name === 'PHD') {
        records = records.filter(record => record.media ? record.media_width > record.media_height : true);
      }

      recordsSpan.end();

      return this.setState({
        records         : records,
        recordsWithMedia: records.filter(record => record.media !== null),
      }, () => {
        const mediaSpan = transaction.startSpan('media-loading')
        // Load the records medias
        const mediaUrls = this.state.recordsWithMedia
                              .map(record => record.media_url)
                              .map(path => path.replace(/\\\//g, '/'));

        return caches.open(process.env.REACT_APP_CACHE_NAME).then(cache =>
          cache.keys().then(keys => {
            const keysUrls = keys.map(key => key.url);
            mediaUrls.forEach(url => {
              if (!keysUrls.includes(url)) {
                cache.add(url);
              }
            });
            mediaSpan.end()
          }),
        );
      });
    }).then(() => {
      // Select the record to display
      let records = this.state.recordsWithMedia;

      // filter records to only use ones with images
      if (records.length < this.state.run.length && !this.state.onlyPictures) {
        // There is not enough records with an image, inject records without images to compensate
        records.push(...this.state.records.slice(0, this.state.run.length - records.length));
      }

      let selectedRecords = shuffle(records.slice(0, 12)).slice(0, this.state.run.length);

      if (selectedRecords.length === 0) {
        // No records to display, skip display
        BroadSignActions.skipDisplay();
      }

      // Get the media url from the cache
      selectedRecords.forEach((record, index) => {
        if (record.media === null) {
          return; // Do nothing if there is no media
        }

        cache.get(record.media_url.replace(/\\\//g, '/'), url => fetch(this.api.prepareUrl(url)))
             .then(response => response.blob())
             .then(blob => URL.createObjectURL(blob))
             .then(url => {
               this.setState({
                 run: {
                   ...this.state.run,
                   mediaURLs: {
                     ...this.state.run.mediaURLs,
                     [index]: url,
                   },
                 },
               });
             });
      });

      transaction.end();

      // Keep only the first 25 articles in the pool, randomize, and select the run-length first
      return this.setState({
        run: {
          ...this.state.run,
          records: selectedRecords,
        },
      });
    });
  };

  beginDisplay = () => {
    if (this.state.display) {
      return; // Already playing
    }

    // Is there anything to show ?
    if (this.state.run.records.length === 0) {
      // No, tell broadsign to stop here as this is not normal behaviour
      BroadSignActions.stopDisplay();
      console.warn('No records to display, stopping here');
      return;
    }

    this.setState({
      display: true,
      run    : {
        ...this.state.run,
        timer: setInterval(this.run, this.state.run.duration),
      },
    });
  };

  run = () => {
    // Is there another records to display ?
    if (this.state.run.step + 1 >= this.state.run.records.length) {
      clearInterval(this.state.run.timer);

      // Are we stopping after the requested number of records ?
      if (this.state.run.step + 1 < this.state.run.length) {
        // No, tell BroadSign to stop here as this is not normal behaviour
        BroadSignActions.stopDisplay();
        console.warn('No records left to display (' +
          this.state.run.step +
          ' instead of ' +
          this.state.run.length +
          '), stopping here');
        return;
      }

      return this.setState({
        run: {
          ...this.state.run,
          timer: null,
        },
      });
    }

    this.setState({
      run: {
        ...this.state.run,
        step: this.state.run.step + 1,
      },
    });
  };

  render() {
    let recordDate = null, headline = null, media = null, recordID = null;

    if (this.state.display) {
      const record = this.state.run.records[this.state.run.step];
      recordDate   = moment.tz(record.date, 'America/Montreal');
      recordID     = record.id;
      headline     = record.headline;
      media        = record.media ? this.state.run.mediaURLs[this.state.run.step] : null;
    }

    const locale = this.state.category ? categoriesLocales[this.state.category] : 'en';

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
          className={ [ this.state.design.name, locale ].join(' ') }
          style={ {
            backgroundImage: this.state.categoryURL ? 'url(' + this.state.categoryURL + ')' : '',
            transform      : 'scale(' + this.state.design.scale + ')',
          } }
          onClick={ this.beginDisplay }>
          {
            this.state.design.name === 'PMP' &&
            <PMPHeadlineBar/>
          }
          {
            (this.state.design.name === 'SHD' || this.state.design.name === 'PHD') &&
            <SHDHeadlineBar category={ this.state.category }
                            network={ this.state.network }/>
          }
          {
            (this.state.design.name !== 'SHD' || this.state.design.name !== 'PHP') &&
            <TimeDisplay design={ this.state.design.name }/>
          }
          <UpdateCaption
            articleTime={ recordDate }
            design={ this.state.design.name }
            key={ [ 'caption-', recordID ].join() }
          />
          <Content
            headline={ headline }
            image={ media }
            background={ this.state.categoryURL }
            design={ this.state.design.name }
            key={ [ 'headline-', recordID ].join() }
            category={ this.state.category }
          />
        </ReactCSSTransitionGroup>
      </IntlProvider>
    );
  }
}

export default withTransaction('news', 'dynamic-root')(App);
