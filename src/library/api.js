export default class API {
  constructor(baseUrl, token) {
    this.base     = baseUrl;
    this.apiToken = token;
  }

  /**
   *
   * @param {string} url
   * @param {string} [method='get']
   * @param {any} [body]
   * @param {boolean} [auth=false]
   * @return {Request}
   */
  prepareUrl(url, method = 'get', body = null, auth = false) {
    let urlObj = new URL(url, this.base);

    if (method === 'get' && body) {
      const params = new URLSearchParams();

      for(const [key, value] of Object.entries(body)) {
        if(Array.isArray(value)) {
          value.forEach(v => params.append(key + '[]', v))
        } else {
          params.append(key, value);
        }
      }

      urlObj.search = '?' + params.toString();
    }

    const req = new Request(urlObj.toString(), { method, body: method === 'get' ? null : body });

    if (auth) {
      req.headers.append('Authorization', 'Bearer ' + this.apiToken);
    }

    return req;
  }

  prepareRoute(route, body) {
    return this.prepareUrl(route.path, route.method, body, route.auth);
  }
}
