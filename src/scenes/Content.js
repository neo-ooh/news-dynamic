import React, { Component } from 'react'

class Content extends Component {
  render() {
    if(this.props.headline === null)
      return null

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
  headline: null,
  image: null
}

export default Content