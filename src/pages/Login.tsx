import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Call API here
    console.log('Login', { email, password });
  };

  const handleGoogleLogin = () => {
    // Redirect to backend google auth endpoint
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Login to Pockie</h1>
      
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label>Email</label>
          <br/>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <div>
          <label>Password</label>
          <br/>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>
        
        <button type="submit" style={{ padding: '0.5rem' }}>Login</button>
      </form>

      <div style={{ marginTop: '1rem', textAlign: 'center' }}>
        <button onClick={handleGoogleLogin} style={{ padding: '0.5rem', width: '100%' }}>
          Login with Google
        </button>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/register">Create an account</Link>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </div>
  );
}
