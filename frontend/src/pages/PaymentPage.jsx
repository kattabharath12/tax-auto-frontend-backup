import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { Payment, CreditCard, AccountBalance, Receipt } from '@mui/icons-material';
import api from '../utils/api';

function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentData, setPaymentData] = useState({
    amount: '',
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    cardholder_name: '',
    bank_account: '',
    routing_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [taxCalculation, setTaxCalculation] = useState(null);

  useEffect(() => {
    loadPaymentHistory();
    loadTaxCalculation();
  }, []);

  const loadPaymentHistory = async () => {
    try {
      const response = await api.get('/payments/history');
      setPaymentHistory(response.data || []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
      // Set empty array if API fails
      setPaymentHistory([]);
    }
  };

  const loadTaxCalculation = async () => {
    try {
      const response = await api.post('/tax/calculate', {
        form_1040: {},
        schedule_a: {},
        schedule_c: {},
        filing_status: "single",
        state: "CA"
      });
      setTaxCalculation(response.data);
      // Check if there's an amount due
      const amountDue = response.data.amount_due || response.data.tax_owed || 0;
      if (amountDue > 0) {
        setPaymentData(prev => ({
          ...prev,
          amount: amountDue.toFixed(2)
        }));
      }
    } catch (err) {
      console.error('Failed to load tax calculation:', err);
      // Set a default calculation if API fails
      setTaxCalculation({
        total_income: 0,
        tax_owed: 0,
        total_withholding: 0,
        refund_amount: 0,
        amount_due: 0
      });
    }
  };

  const handleInputChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const processPayment = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        amount: parseFloat(paymentData.amount),
        payment_method: paymentMethod,
        description: 'Tax Payment'
      };

      if (paymentMethod === 'card') {
        payload.card_details = {
          card_number: paymentData.card_number,
          expiry_month: parseInt(paymentData.expiry_month),
          expiry_year: parseInt(paymentData.expiry_year),
          cvv: paymentData.cvv,
          cardholder_name: paymentData.cardholder_name
        };
      } else if (paymentMethod === 'bank') {
        payload.bank_details = {
          account_number: paymentData.bank_account,
          routing_number: paymentData.routing_number
        };
      }

      const response = await api.post('/payments/charge', payload);
      setMessage(`Payment successful! Transaction ID: ${response.data.transaction_id || response.data.id}`);
      
      // Clear form
      setPaymentData({
        amount: '',
        card_number: '',
        expiry_month: '',
        expiry_year: '',
        cvv: '',
        cardholder_name: '',
        bank_account: '',
        routing_number: ''
      });
      
      // Reload payment history
      loadPaymentHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const renderCardPayment = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Card Number"
          value={paymentData.card_number}
          onChange={(e) => handleInputChange('card_number', e.target.value)}
          placeholder="1234 5678 9012 3456"
          inputProps={{ maxLength: 19 }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Cardholder Name"
          value={paymentData.cardholder_name}
          onChange={(e) => handleInputChange('cardholder_name', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="CVV"
          value={paymentData.cvv}
          onChange={(e) => handleInputChange('cvv', e.target.value)}
          inputProps={{ maxLength: 4 }}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Expiry Month"
          type="number"
          value={paymentData.expiry_month}
          onChange={(e) => handleInputChange('expiry_month', e.target.value)}
          inputProps={{ min: 1, max: 12 }}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          label="Expiry Year"
          type="number"
          value={paymentData.expiry_year}
          onChange={(e) => handleInputChange('expiry_year', e.target.value)}
          inputProps={{ min: new Date().getFullYear() }}
        />
      </Grid>
    </Grid>
  );

  const renderBankPayment = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Bank Account Number"
          value={paymentData.bank_account}
          onChange={(e) => handleInputChange('bank_account', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Routing Number"
          value={paymentData.routing_number}
          onChange={(e) => handleInputChange('routing_number', e.target.value)}
        />
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tax Payment
      </Typography>

      {/* Tax Summary */}
      {taxCalculation && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tax Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    ${taxCalculation.total_income?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2">Total Income</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="error">
                    ${taxCalculation.tax_owed?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2">Tax Owed</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="secondary">
                    ${taxCalculation.total_withholding?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2">Total Withholding</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color={taxCalculation.refund_amount > 0 ? 'success.main' : 'error'}>
                    ${Math.abs(taxCalculation.refund_amount || taxCalculation.amount_due || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    {taxCalculation.refund_amount > 0 ? 'Refund Expected' : 'Amount Due'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Payment Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Make Payment
          </Typography>

          {/* Payment Amount */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Payment Amount"
              type="number"
              value={paymentData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
              sx={{ mb: 2 }}
            />
          </Box>

          {/* Payment Method Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Payment Method
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant={paymentMethod === 'card' ? 'contained' : 'outlined'}
                onClick={() => setPaymentMethod('card')}
                startIcon={<CreditCard />}
              >
                Credit/Debit Card
              </Button>
              <Button
                variant={paymentMethod === 'bank' ? 'contained' : 'outlined'}
                onClick={() => setPaymentMethod('bank')}
                startIcon={<AccountBalance />}
              >
                Bank Transfer
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Payment Details */}
          {paymentMethod === 'card' && renderCardPayment()}
          {paymentMethod === 'bank' && renderBankPayment()}

          {/* Submit Button */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={processPayment}
              disabled={loading || !paymentData.amount}
              startIcon={loading ? <CircularProgress size={20} /> : <Payment />}
            >
              {loading ? 'Processing...' : `Pay $${paymentData.amount || '0.00'}`}
            </Button>
          </Box>

          {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment History
          </Typography>
          
          {paymentHistory.length === 0 ? (
            <Typography color="text.secondary">
              No payments made yet.
            </Typography>
          ) : (
            <List>
              {paymentHistory.map((payment) => (
                <ListItem key={payment.id} sx={{ border: '1px solid', borderColor: 'grey.300', mb: 1, borderRadius: 1 }}>
                  <Receipt sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary={`$${payment.amount?.toFixed(2) || '0.00'} - ${payment.description || 'Tax Payment'}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Date: {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Transaction ID: {payment.transaction_id || payment.id || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Method: {payment.payment_method?.toUpperCase() || 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                  <Chip
                    label={payment.status || 'pending'}
                    color={payment.status === 'completed' ? 'success' : 'default'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default PaymentPage;