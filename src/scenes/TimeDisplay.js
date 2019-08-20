import React, { Component } from 'react'
import Clock from 'react-live-clock'

export default class TimeDisplay extends Component {
  render() {
    return (
      <Clock format={ 'HH:mm' }
             ticking={ true }
             key={ 'clock' }
             className={['clock', this.props.design].join(' ')} />
    )
  }
}