import React, { Component } from 'react'
import { injectIntl } from "react-intl"
import messages from '../library/messages'
import moment from 'moment-timezone'

class UpdateCaption extends Component {
  render() {
    if(this.props.articleTime === null)
      return null

    const now = moment()
    const articleAge = moment.duration(Math.abs(now.diff(this.props.articleTime))).asHours();

    // If article is a bit old, do not show its age
    if(articleAge > 6)
      return null

    // Select the appropriate message
    const message = articleAge < 1 ? messages.updatedJustNow: messages.updatedXHoursAgo

    return (
      <section id="update-caption" className={this.props.design}>
        <span className="label">
          { this.props.intl.formatMessage(messages.updatedAt) }
        </span><br />
        <span className="time">
          { this.props.intl.formatMessage(message, {hours: Math.floor(articleAge)}) }
        </span>
      </section>
    )
  }
}

export default injectIntl(UpdateCaption)