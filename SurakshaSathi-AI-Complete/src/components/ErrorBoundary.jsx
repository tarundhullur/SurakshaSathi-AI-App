import React from "react"
import { AlertOctagon, RotateCcw } from "lucide-react"

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught error in React ErrorBoundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-800">
          <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600">
              <AlertOctagon size={32} />
            </span>
            <h1 className="mt-4 text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              An unexpected display issue occurred. You can safely return to the home page or try reloading.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 rounded-xl bg-slate-100 p-3 text-left font-mono text-xs text-slate-700 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.href = "/"
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white hover:bg-teal-800 cursor-pointer"
              >
                <RotateCcw size={16} />
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
