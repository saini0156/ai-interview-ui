import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "var(--bg, #060810)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "var(--display, 'Inter', system-ui, sans-serif)",
          color: "var(--text, #e2e8f0)"
        }}>
          <div style={{
            maxWidth: 520,
            width: "100%",
            background: "rgba(15,23,42,0.85)",
            border: "1px solid rgba(244,63,94,0.3)",
            borderRadius: 20,
            padding: "48px 40px",
            textAlign: "center",
            backdropFilter: "blur(16px)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5), 0 0 40px rgba(244,63,94,0.1)"
          }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
            <h2 style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#f43f5e",
              marginBottom: 12,
              letterSpacing: "-0.02em"
            }}>
              Something Went Wrong
            </h2>
            <p style={{
              fontSize: 14,
              color: "rgba(226,232,240,0.7)",
              lineHeight: 1.6,
              marginBottom: 24
            }}>
              An unexpected error occurred in the application. Please try refreshing the page.
            </p>

            {this.state.error && (
              <div style={{
                background: "rgba(244,63,94,0.06)",
                border: "1px solid rgba(244,63,94,0.15)",
                borderRadius: 12,
                padding: "14px 18px",
                marginBottom: 24,
                textAlign: "left"
              }}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#f43f5e",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6
                }}>
                  Error Details
                </div>
                <pre style={{
                  fontSize: 12,
                  color: "rgba(226,232,240,0.6)",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: "var(--mono, 'JetBrains Mono', monospace)",
                  lineHeight: 1.5,
                  maxHeight: 120,
                  overflow: "auto"
                }}>
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 28px",
                  background: "#f43f5e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 20px rgba(244,63,94,0.3)"
                }}
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                style={{
                  padding: "12px 24px",
                  background: "transparent",
                  color: "rgba(226,232,240,0.6)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
