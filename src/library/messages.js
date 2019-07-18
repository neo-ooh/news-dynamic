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
  updatedXHoursAgo: {
    id:'news.updated-x-hours-ago',
    description:'Specify how many hours ago the article was updated',
    defaultMessage:'{hours} hours ago',
  },
  updatedJustNow: {
    id:'news.updated-just-now',
    description:'Tell the article has been updated recently',
    defaultMessage:'Just now',
  }
})
