import React, { Component } from 'react'
import { injectIntl } from 'react-intl'
import messages from '../library/messages'

class PMPHeadlineBar extends Component {
  render () {
    return (
      <div className="headline-bar">
        { this.props.intl.formatMessage(messages.headlines)}
      </div>
    )
  }
}

export default injectIntl(PMPHeadlineBar)