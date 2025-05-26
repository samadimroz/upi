// === FRONTEND: React Component for Home Screen ===

import React, { useState } from 'react';
import axios from 'axios';
import "./App.css"
import banner from "./assets/banner.jpg"
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

function HomeScreen() {
  const [phone, setPhone] = useState('');
  const [screen, setScreen] = useState('home'); // home | register | login | dashboard

  const api = 'http://localhost:5002';

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
      alert(err.response?.data?.error);
    }
  };

    const handleEnableUpi = async () => {
    try {
      const res = await axios.post(`${api}/enable-upi`, { phone });
      alert(res.data.message);
      setScreen('dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

     const handleDisableUpi = async () => {
    try {
      const res = await axios.post(`${api}/disable-upi`, { phone });
      alert(res.data.message);
      setScreen('dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

      const accountBalance = async () => {
    try {
      const res = await axios.get(`${api}/balance/${phone}`);
      alert('Your account balance is: '+res.data.balance);
      setScreen('dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

    const handleAddMoney = async () => {
    const amount = parseFloat(prompt('Enter amount to add:'));
    try {
      const res = await axios.post(`${api}/add-money`, { phone, amount });
      alert(res.data.message);
      setScreen('dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };
  return (
    <Container>
      <Row>
        <Col md={6}>
          <img src={banner} alt='banner' style={{ height: 600 }} />
        </Col>

        <Col md={6}>
          {screen === 'home' && (
            <Card className='login_register'>

              <h2>Welcome to UPI App</h2>
              <Col className='d-flex justify-content-center'>
                <Button onClick={() => setScreen('register')}>Register</Button>
                <Button onClick={() => setScreen('login')}>Login</Button>
              </Col>
            </Card>

          )}

          {(screen === 'register' || screen === 'login') && (
            <div >
              <Card className='login_register'>
                <h3 className=''>{screen === 'register' ? 'Register' : 'Login'}</h3>
                <Form.Control
                  type="text"
                  placeholder="Enter 10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                /><br />
                <Button onClick={screen === 'register' ? handleRegister : handleLogin}>
                  {screen === 'register' ? 'Register' : 'Login'}
                </Button>
                <Button onClick={() => setScreen('home')}>Back</Button>
              </Card>
            </div>
          )}

          {screen === 'dashboard' && (
            <div>
              <Card className='login_register'>
                <h3>Welcome, {phone}</h3>
                <Button onClick={handleTransfer}>Transfer Money</Button>
                <Button onClick={accountBalance}>Account Balance</Button>
                <Button onClick={handleEnableUpi}>Enable UPI</Button>
                <Button onClick={handleDisableUpi}>Disable UPI</Button>
                <Button onClick={handleAddMoney}>Add money</Button>
                <Button onClick={() => setScreen('home')}>Logout</Button>
              </Card>
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default HomeScreen;
