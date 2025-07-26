import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import api from '../utils/api';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setProfile(res.data))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Card sx={{ width: 400 }}>
        <CardContent>
          <Typography variant="h5" color="primary" gutterBottom>
            Profile
          </Typography>
          <Typography>Email: {profile.email}</Typography>
          <Typography>Name: {profile.name}</Typography>
          <Typography>State: {profile.state}</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Profile;