import { useState, useEffect } from 'react';

interface Usage {
  content_generated: number;
  api_calls: number;
  storage_used: number;
}

export function useUsage() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Mock usage data for now
    setTimeout(() => {
      setUsage({
        content_generated: 15,
        api_calls: 245,
        storage_used: 128,
      });
      setLoading(false);
    }, 1000);
  }, []);

  return {
    usage,
    loading,
    error,
  };
}
