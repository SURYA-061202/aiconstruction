import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        height: '100vh', width: '100vw', display: 'flex', 
        alignItems: 'center', justifyContent: 'center', 
        background: '#F9FAFB', color: '#6B7280', fontSize: 13
      }}>
        Loading Rck Engine...
      </div>
    );
  }

  return user ? <Dashboard user={user} /> : <Login />;
}

export default App;
