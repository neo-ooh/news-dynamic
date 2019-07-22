export function get (url) {
  console.log('retrieving ' + url)
  // Start by checking if the requested url isn't already stored
  return caches.open(process.env.REACT_APP_CACHE_NAME).then(cache =>
    cache.match(url).then(response => {
      // Is the request missing from the cache
      if (response === undefined) {
        return add(url).then(response => response.json().then(data => { data.url = url; return data }))
      }

      // decode response
      return response.json().then(data => {
        // Is the request too old
        const responseTime = data.timestamp * 1000
        const refreshRate = process.env.REACT_APP_ENV === 'production' ? data.refresh * 1000 : 120 * 1000 // API refresh or 2 minutes in development

        if (Date.now() - responseTime > refreshRate) {
          return add(url).then(response => response.json().then(data => { data.url = url; return data }))
        }

        // Request OK, let's return it
        data.url = url
        return data
      })
    })
  )
}

export function add (url) {
  let headers = new Headers()
  headers.append('pragma', 'no-cache')
  headers.append('cache-control', 'no-cache')

  return fetch(url, {headers: headers, mode: 'cors'}).then(response => {
    if (response.status !== 200) {
      return response
    }

    const resp = response.clone()

    caches.open(process.env.REACT_APP_CACHE_NAME).then(cache =>
      cache.delete(url).then(() =>
        cache.put(url, response)
      )
    )

    return resp
  })
}

export function remove (url) {
  return caches.open(process.env.REACT_APP_CACHE_NAME).then(cache =>
    cache.delete(url)
  )
}
