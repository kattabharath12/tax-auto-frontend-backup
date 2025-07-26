import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [form, setForm] = useState({ email: '', password: '', name: '', ssn: '', dob: '', address: '', state: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await api.post('/auth/register', form);
      setMsg('Registration successful! Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <Card sx={{ width: 400 }}>
        <CardContent>
          <Typography variant="h5" color="primary" gutterBottom>
            Register
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" name="email" value={form.email} onChange={handleChange} margin="normal" required />
            <TextField fullWidth label="Password" name="password" type="password" value={form.password} onChange={handleChange} margin="normal" required />
            <TextField fullWidth label="Name" name="name" value={form.name} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="SSN" name="ssn" value={form.ssn} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Date of Birth" name="dob" value={form.dob} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="Address" name="address" value={form.address} onChange={handleChange} margin="normal" />
            <TextField fullWidth label="State" name="state" value={form.state} onChange={handleChange} margin="normal" />
            <Button variant="contained" color="primary" fullWidth type="submit" sx={{ mt: 2 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
          </form>
          {msg && <Alert severity="success" sx={{ mt: 2 }}>{msg}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>
    </Box>
  );
}

export default Register;