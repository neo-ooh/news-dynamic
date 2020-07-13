import React, { Component } from 'react'
import { injectIntl } from 'react-intl'

const categoryLabels = [
  'National News',
  'International News',
  'Sports',
  'Business',
  'Entertainment',
  'Variety',
  'Nouvelles',
  'Varia',
  'Sport',
]

class PMPHeadlineBar extends Component {
  render () {
    return [
      <div className={ "headline-bar c" + this.props.category } key="headlines">
        { categoryLabels[this.props.category-1] }
      </div>,
      <div className={['legals', this.props.network].join(' ')} key="legals"/>
    ]
  }
}

export default injectIntl(PMPHeadlineBar)
