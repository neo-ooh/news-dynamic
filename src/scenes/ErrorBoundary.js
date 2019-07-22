import React, {Component} from 'react'
import Error from './ErrorBoundary/Error'

class ErrorBoundary extends Component {
  constructor (props) {
    super(props)
    this.state = { hasError: false, msg: '' }
  }

  componentDidCatch (error, info) {
    // Display fallback UI
    this.setState({ hasError: true, error: error, errorInfo: info })
  }

  render () {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      console.log(this.state.errorInfo)
      return <Error
        message={ this.state.error.toString() }
        stack={ this.state.errorInfo.componentStack }
      />
    }
    return this.props.children
  }
}

export default ErrorBoundary
