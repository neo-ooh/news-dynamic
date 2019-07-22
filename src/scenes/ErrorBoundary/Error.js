import React, { Component } from 'react'

export default class Error extends Component {
  render () {
    if(process.env.REACT_APP_ENV !== 'production') {
      return (
        <section id="error-screen">
          <h1>Weather Dynamic</h1>
          <h3>An error as occurred</h3>
          <h6>v0.403 - { window.location.href }</h6>
          <h5>{ this.props.message }</h5>
          <h5 className="stack">{ this.props.stack || '' }</h5>
        </section>
      )
    }

    return (
      <section id="neo-logo-screen">
      </section>
    )
  }
}
