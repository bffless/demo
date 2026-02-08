import { useState, useEffect } from 'react';

interface FeatureFlag {
  enabled: boolean;
  description: string;
  rollout_percentage: number;
}

interface FeatureFlags {
  flags: Record<string, FeatureFlag>;
  version: string;
  last_updated: string;
}

function App() {
  const [count, setCount] = useState(0);
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/flags/features.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setFlags(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container">
      <h1>Demo App</h1>
      <p>A simple React + TypeScript + Vite demo.</p>
      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>Count is {count}</button>
      </div>

      <div className="card" style={{ marginTop: '2rem', textAlign: 'left' }}>
        <h2>Feature Flags</h2>
        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
          Fetched via proxy rule: <code>/flags/*</code> → <code>demo-feature-flags</code>
        </p>

        {loading && <p>Loading flags...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {flags && (
          <div>
            <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
              Version: {flags.version} | Updated: {flags.last_updated}
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Flag</th>
                  <th style={{ textAlign: 'center', padding: '0.5rem' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Rollout</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(flags.flags).map(([key, flag]) => (
                  <tr key={key} style={{ borderTop: '1px solid #333' }}>
                    <td style={{ padding: '0.5rem' }}>
                      <strong>{key}</strong>
                      <br />
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{flag.description}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '0.5rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          background: flag.enabled ? '#22c55e' : '#ef4444',
                          color: 'white',
                        }}
                      >
                        {flag.enabled ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>
                      {flag.rollout_percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
