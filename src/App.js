import React, { Component } from 'react'
import './style/App.scss'

import Content from "./scenes/Content"
import UpdateCaption from "./scenes/UpdateCaption"

import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

class App extends Component {
  constructor (props) {
    super(props)


    // Detect the support


    this.state = {
      support: this.detectSupport()
    }
  }

  supports = [
    {name: 'FCL', width: '3840', height: '1080', design: 'FCL'},
    {name: 'DCA', width: '1080', height: '1920', design: 'DCA'},
  ]

  detectSupport () {
    const isBroadsignPlayer = typeof window.BroadSignObject !== 'undefined'
    if(!isBroadsignPlayer) {
      console.log('This is not a BroadSign Player')
    }

    // Get the support resolution
    const supportResolution = isBroadsignPlayer
      ? window.BroadSignObject.display_unit_resolution
      : this.props.windowWidth + "x" + this.props.windowHeight

    console.log('Current resolution: ' + supportResolution)
    const supportIndex = this.supports.findIndex(support => supportResolution === (support.width + "x" + support.height))

    if(supportIndex === -1) {
      const supportParameter = (new URLSearchParams(window.location.search)).get('support')
      const support = this.supports.find(s => s.name === supportParameter )
      return support !== undefined ? support : this.supports[0]
    }

    console.log('Support: ' + this.supports[supportIndex].name + ' (' + this.supports[supportIndex].design + ')')
    return this.supports[supportIndex]
  }

  render () {
    return (
      <ReactCSSTransitionGroup
        transitionName="transition-article"
        transitionAppearTimeout={500}
        transitionEnterTimeout={500}
        transitionLeaveTimeout={500}
        transitionAppear={true}
        transitionEnter={true}
        transitionLeave={true}
        component="main"
        className={[this.state.support.name, this.state.support.design].join(' ')} >
        <UpdateCaption
          articleTime={new Date()}
          design={ this.state.support.design }
          ref={ "caption-1234" }
        />
        <Content
          headline="Prince Harry holds the Wales hockey jersey up with Trudeau as they met with Invictus Games athletes after a sledge-hockey match on May 2"
          image="https://medias.liberation.fr/photo/1158366-la-cour-de-cassation-se-prononce-mercredi-sur-le-bareme-prud-homal-pour-licenciement-abusif.jpg?modified_at=1563370220&width=960"
          design={ this.state.support.design }
          ref={ "content-1234" }
          />
      </ReactCSSTransitionGroup>
    );
  }
}

export default App;
