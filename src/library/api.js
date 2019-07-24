import { cache } from 'dynamics-utilities'

export default class API {
  // Main function
  static get(path) {
    return cache.getJson(API.baseURL + path + '?key=' + API.APIKey)
  }

  static getBackgrounds(support) {
    return this.get('/backgrounds/' + support)
  }

  static getRecords(category) {
    return this.get('/records/' + category)
  }

  // ///////
  // LOCALE
  static APIKey = '';
  static baseURL = process.env.REACT_APP_API_URL
}
