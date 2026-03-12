import { useState, useCallback } from 'react';

/**
 * useRckEngine
 * Standard hook for triggering construction-specific AI validation via RCK Engine.
 */
export const useRckEngine = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const performValidation = useCallback(async (fileData) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Prepare Multipart FormData for the RCK Engine
      const formData = new FormData();
      formData.append('file', fileData);
      formData.append('options', JSON.stringify({
        domain: "aec",
        mock_mode: true
      }));

      // 2. Connect to RCK Engine (Direct Fetch matching chat-client)
      const response = await fetch('http://localhost:8000/v1/analyse/aec-drawings-v1', {
        method: 'POST',
        headers: {
          'x-api-key': 'rck_live_51e4987fe5d62c5d966a5692d09ef4e1'
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail?.message || `Server Error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('RCK Connection Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [error]);

  return { performValidation, loading, data, error };
};
