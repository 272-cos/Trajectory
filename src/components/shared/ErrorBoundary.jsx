import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  handleClearAndReset = () => {
    try {
      localStorage.clear()
    } catch (_) {
      // localStorage may be unavailable
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md w-full text-center space-y-4">
            <h1 className="text-xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-gray-600 text-sm">
              The app hit an unexpected error. Your saved data should still be intact.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
              >
                Try Again
              </button>
              <button
                onClick={this.handleClearAndReset}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 min-h-[44px] text-sm"
              >
                Clear Data and Reload
              </button>
            </div>
            <p className="text-xs text-gray-400">
              UNOFFICIAL ESTIMATE - Not for official use
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
