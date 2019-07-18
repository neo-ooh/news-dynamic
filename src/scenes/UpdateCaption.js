import React, { Component } from 'react'
import { injectIntl } from "react-intl";
import messages from '../library/messages'

class UpdateCaption extends Component {
  render() {
    const now = new Date()
    const articleAge = Math.abs(now - this.props.articleTime) / 36e5; // 36e5 = 360000 = 60*60*1000

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
          { this.props.intl.formatMessage(message, {hours: 6}) }
        </span>
      </section>
    )
  }
}

UpdateCaption.defaultProps = {
  articleTime: new Date()
}

export default injectIntl(UpdateCaption)