import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, retryCount: 0 }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleReset = () => {
    this.setState(prev => ({
      hasError: false,
      retryCount: prev.retryCount + 1,
    }))
  }

  handleClearAndReset = () => {
    try {
      localStorage.clear()
    } catch {
      // localStorage may be unavailable
    }
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const stuck = this.state.retryCount >= 1

      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md w-full text-center space-y-4">
            <h1 className="text-xl font-bold text-gray-900">
              {stuck ? 'Still not working' : 'Something went wrong'}
            </h1>
            <p className="text-gray-600 text-sm">
              {stuck
                ? 'The error persists. This is usually caused by corrupted saved data. Clearing data will fix it - your profile and assessment codes can be re-entered.'
                : 'The app hit an unexpected error. Your saved data should still be intact.'}
            </p>
            <div className="space-y-3">
              {!stuck && (
                <button
                  onClick={this.handleReset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={this.handleClearAndReset}
                className={`w-full font-semibold py-3 px-5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px] ${
                  stuck
                    ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-400 text-sm'
                }`}
              >
                Clear Data and Reload
              </button>
              {stuck && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-5 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 min-h-[44px] text-sm"
                >
                  Reload Page
                </button>
              )}
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
