import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/users/`, {
        username: username.trim()
      });
      onLogin(response.data);
    } catch (error) {
      console.error('Login failed', error);
      alert('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ border: '1px solid var(--accent-color)' }}>
        <h1 style={{ color: 'var(--accent-color)', WebkitBackgroundClip: 'unset', WebkitTextFillColor: 'unset', background: 'none' }}>SECURE LOGIN</h1>
        <p>Enter clearance credentials to access operations</p>
        <form onSubmit={handleSubmit} className="input-group">
          <input
            type="text"
            placeholder="Operator ID (Username)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            autoFocus
            style={{ fontFamily: 'inherit' }}
          />
          <button type="submit" disabled={loading || !username.trim()} style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
            {loading ? 'Authenticating...' : 'Authorize'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
