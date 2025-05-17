// === FRONTEND: React Component for Home Screen ===

import React, { useState } from 'react';
import axios from 'axios';
import "./App.css"

function HomeScreen() {
  const [phone, setPhone] = useState('');
  const [screen, setScreen] = useState('home'); // home | register | login | dashboard

  const api = 'http://localhost:5000';

  const handleRegister = async () => {
    try {
      const res = await axios.post(`${api}/register`, { phone });
      alert(res.data.message);
      setScreen('dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${api}/login`, { phone });
      alert('Login successful');
      setScreen('dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Login failed');
    }
  };

  const handleTransfer = async () => {
    const toPhone = prompt('Enter recipient phone number:');
    const amount = parseFloat(prompt('Enter amount to transfer:'));

    try {
      const res = await axios.post(`${api}/transfer`, { fromPhone: phone, toPhone, amount });
      alert(res.data.message);
    } catch (err) {
      alert(err.response?.data?.error || 'Transfer failed');
    }
  };

  return (
    <div className="home-container">
      {screen === 'home' && (
        <>
          <h2>Welcome to UPI App</h2>
          <button onClick={() => setScreen('register')}>Register</button>
          <button onClick={() => setScreen('login')}>Login</button>
        </>
      )}

      {(screen === 'register' || screen === 'login') && (
        <div>
          <h3>{screen === 'register' ? 'Register' : 'Login'}</h3>
          <input
            type="text"
            placeholder="Enter 10-digit phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          /><br />
          <button onClick={screen === 'register' ? handleRegister : handleLogin}>
            {screen === 'register' ? 'Register' : 'Login'}
          </button>
          <button onClick={() => setScreen('home')}>Back</button>
        </div>
      )}

      {screen === 'dashboard' && (
        <div>
          <h3>Welcome, {phone}</h3>
          <button onClick={handleTransfer}>Transfer Money</button>
          <button onClick={() => setScreen('home')}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default HomeScreen;
