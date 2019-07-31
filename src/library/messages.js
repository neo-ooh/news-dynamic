import { defineMessages } from "react-intl";

export default defineMessages({
  generateURL: {
    id: 'news.no-headline',
    description: 'Tell the user no headline has been provided to the Content scene',
    defaultMessage: 'No headline available',
  },
  updatedAt: {
    id:'news.updated-at',
    description:'Label present before the update time of the presented record',
    defaultMessage:'Updated',
  },
  updatedXMinutesAgo: {
    id:'news.updated-x-minutes-ago',
    description:'Specify how many minutes ago the article was updated',
    defaultMessage:'{age} minutes ago',
  },
  updatedXHoursAgo: {
    id:'news.updated-x-hours-ago',
    description:'Specify how many hours ago the article was updated',
    defaultMessage:'{age} hours ago',
  },
  updatedOneHourAgo: {
    id:'news.updated-one-hours-ago',
    description:'Tell the article was updated one hour ago',
    defaultMessage:'One hour ago',
  },
  updatedJustNow: {
    id:'news.updated-just-now',
    description:'Tell the article has been updated recently',
    defaultMessage:'Just now',
  }
})
