import React, { Component } from 'react'
import { injectIntl } from "react-intl"
import messages from '../library/messages'
import moment from 'moment-timezone'

class UpdateCaption extends Component {
  render() {
    if(this.props.articleTime === null)
      return null

    const now = moment()
    const articleAge = moment.duration(Math.abs(now.diff(this.props.articleTime)));

    // If article is a bit old, do not show its age
    if(articleAge > 6)
      return null

    let articleAgeLitteral = null
    let message = null

    const articleAgeHours = articleAge.asHours()

    if(articleAgeHours < 1) {
      // Article age is less than an hour, show minutes
      articleAgeLitteral = articleAge.asMinutes()
      message = articleAgeLitteral < 10 ? messages.updatedJustNow : messages.updatedXMinutesAgo
    } else {
      // Article more than an hour, show hours
      articleAgeLitteral = articleAgeHours
      message = articleAgeLitteral === 1 ? messages.updatedOneHourAgo : messages.updatedXMinutesAgo
    }

    return (
      <section id="update-caption" className={this.props.design}>
        <span className="label">
          { this.props.intl.formatMessage(messages.updatedAt) }
        </span><br />
        <span className="time">
          { this.props.intl.formatMessage(message, {age: Math.floor(articleAge)}) }
        </span>
      </section>
    )
  }
}

export default injectIntl(UpdateCaption)