import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface GoogleConnectButtonProps {
  userId: number;
  onConnectionChange?: (connected: boolean) => void;
}

interface ConnectionStatus {
  connected: boolean;
  expired?: boolean;
  expiry_time?: string;
  email?: string;
}

const GoogleConnectButton: React.FC<GoogleConnectButtonProps> = ({ 
  userId, 
  onConnectionChange 
}) => {
  const [status, setStatus] = useState<ConnectionStatus>({ connected: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const OAUTH_SERVICE_URL = 'http://localhost:8003';
  const FRONTEND_URL = window.location.origin; // Auto-detect: http://localhost:5173 or 3000

  // Check connection status on mount
  useEffect(() => {
    checkConnectionStatus();
  }, [userId]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(
        `${OAUTH_SERVICE_URL}/api/oauth/google/status/${userId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        onConnectionChange?.(data.connected);
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get OAuth URL
      const response = await fetch(
        `${OAUTH_SERVICE_URL}/api/oauth/google/init?user_id=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to initialize OAuth');
      }

      const data = await response.json();

      // Listen for OAuth completion message
      const messageHandler = (event: MessageEvent) => {
        // Security: verify origin
        if (event.origin !== OAUTH_SERVICE_URL && event.origin !== FRONTEND_URL) {
          return;
        }

        if (event.data.type === 'OAUTH_SUCCESS' || event.data.type === 'OAUTH_COMPLETE') {
          window.removeEventListener('message', messageHandler);
          // Check connection status after OAuth completes
          setTimeout(() => {
            checkConnectionStatus();
            setLoading(false);
          }, 1000);
        } else if (event.data.type === 'OAUTH_ERROR') {
          window.removeEventListener('message', messageHandler);
          setError('OAuth failed. Please try again.');
          setLoading(false);
        }
      };

      window.addEventListener('message', messageHandler);

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        data.auth_url,
        'Google OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        window.removeEventListener('message', messageHandler);
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Fallback: Poll for popup close (with try-catch to suppress COOP warnings)
      const pollTimer = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(pollTimer);
            window.removeEventListener('message', messageHandler);
            // Check connection status after popup closes
            setTimeout(() => {
              checkConnectionStatus();
              setLoading(false);
            }, 1000);
          }
        } catch (e) {
          // Ignore COOP policy errors
        }
      }, 1000);

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollTimer);
        window.removeEventListener('message', messageHandler);
        if (loading) {
          setLoading(false);
          setError('OAuth timeout. Please try again.');
        }
      }, 300000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${OAUTH_SERVICE_URL}/api/oauth/google/disconnect/${userId}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      setStatus({ connected: false });
      onConnectionChange?.(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  if (status.connected) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircle className="text-green-600 w-6 h-6" />
            <div>
              <p className="font-medium text-green-900">
                Google Account Connected
              </p>
              {status.email && (
                <p className="text-sm text-green-700">{status.email}</p>
              )}
              <p className="text-xs text-green-600 mt-1">
                ✅ Using your own Google Cloud quota
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        </div>

        {status.expired && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ Token expired. Click Connect to refresh.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 mb-1">
            Connect Your Google Account
          </h3>
          <p className="text-sm text-blue-700 mb-2">
            Use your own Google Cloud quota for free features:
          </p>
          <ul className="text-xs text-blue-600 space-y-1 ml-4">
            <li>• Vision API: 1,000 requests/month FREE</li>
            <li>• Translation: 500,000 characters/month FREE</li>
            <li>• Speech: 60 minutes/month FREE</li>
          </ul>
        </div>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 shadow-sm"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="font-medium">
            {loading ? 'Connecting...' : 'Connect Google'}
          </span>
        </button>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      <div className="mt-3 p-2 bg-gray-50 rounded">
        <p className="text-xs text-gray-600">
          💡 <strong>Note:</strong> If you don't connect, the app will use a shared API key with limited quota.
        </p>
      </div>
    </div>
  );
};

export default GoogleConnectButton;
