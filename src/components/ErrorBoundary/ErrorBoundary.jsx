import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Captura detalles del error
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log del error para debugging
    console.error('❌ Error capturado por ErrorBoundary:', error);
    console.error('📍 Error info:', errorInfo);

    // En producción, aquí podrías enviar el error a un servicio de monitoreo
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Aquí integrarías con Sentry, LogRocket, etc.
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      console.log('📊 Error data for monitoring service:', errorData);
      // TODO: Enviar a servicio de monitoreo
    } catch (loggingError) {
      console.error('❌ Error logging failed:', loggingError);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // UI de error personalizada
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Ups! Algo salió mal
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              Ocurrió un error inesperado en la aplicación. No te preocupes, 
              nuestro equipo ha sido notificado y estamos trabajando para solucionarlo.
            </p>

            {/* Error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left text-sm">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Debug Info (solo en desarrollo):
                </h3>
                <p className="text-red-600 font-mono break-all">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-700">
                      Ver stack trace
                    </summary>
                    <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {/* Primary action - Retry */}
              <button
                onClick={this.handleRetry}
                className="w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-primary-700 hover:to-accent-700 transition-all flex items-center justify-center"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Intentar de nuevo
              </button>

              {/* Secondary actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleGoHome}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Ir al inicio
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recargar
                </button>
              </div>
            </div>

            {/* Help text */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">
                Si el problema persiste, puedes contactarnos:
              </p>
              <a
                href="mailto:support@letranido.com"
                className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                <Mail className="h-4 w-4 mr-1" />
                support@letranido.com
              </a>
            </div>

            {/* Error ID for support */}
            {this.state.error && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-400">
                  Error ID: {Date.now()}-{Math.random().toString(36).substr(2, 9)}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Si no hay error, renderizar children normalmente
    return this.props.children;
  }
}

export default ErrorBoundary;