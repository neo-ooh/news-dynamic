import React, { Component } from 'react'
import { injectIntl, FormattedMessage } from "react-intl";

class Content extends Component {
  render() {
    const headlineStyle = this.props.image ? 'ribbon' : 'full'
    const textSize = this.props.headline.length > 150 ? 'long-text' : ''

    return (
      <section id="news-content" className={this.props.design}>
        { this.props.image &&
          <div className="image" style={{backgroundImage: "url(" + this.props.image + ")" }}/>
        }
        <h1 className={ ['headline', headlineStyle, textSize].join(' ') }>
          <span>{ this.props.headline }</span>
        </h1>
      </section>
    )
  }
}

Content.defaultProps = {
  headline: <FormattedMessage id="news.no-headline"
                              defaultMessage="No headline available"
                              description="Tell the user no headline has been provided to the Content scene"/>,
  image: null
}

export default injectIntl(Content)