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
  Tabs,
  Tab,
  Paper,
  Chip
} from '@mui/material';
import { Save, Calculate, AutoAwesome } from '@mui/icons-material';
import api from '../utils/api';
import { mapDocumentToForm } from '../utils/formMapping';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`form-tabpanel-${index}`}
      aria-labelledby={`form-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function TaxForms() {
  const [activeTab, setActiveTab] = useState(0);
  const [forms, setForms] = useState({
    '1040': {},
    'schedule_a': {},
    'schedule_c': {},
    'w9': {}
  });
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [calculation, setCalculation] = useState(null);

  useEffect(() => {
    loadUserDocuments();
    loadFormTemplates();
  }, []);

  const loadUserDocuments = async () => {
    try {
      const response = await api.get('/files/user-documents');
      setUploadedDocs(response.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
      setUploadedDocs([]);
    }
  };

  const loadFormTemplates = async () => {
    try {
      const formTypes = ['1040', 'schedule_a', 'schedule_c', 'w9'];
      const promises = formTypes.map(type => 
        api.get(`/tax/forms/${type}`).catch(() => ({ data: {} }))
      );
      const results = await Promise.all(promises);
      
      const newForms = {};
      formTypes.forEach((type, index) => {
        newForms[type] = results[index].data || {};
      });
      setForms(newForms);
    } catch (err) {
      console.error('Failed to load form templates:', err);
    }
  };

  const autoFillFromDocuments = () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const newForms = { ...forms };
      
      uploadedDocs.forEach(doc => {
        if (doc.extracted_data) {
          // Auto-fill Form 1040
          const form1040Data = mapDocumentToForm(doc.extracted_data, '1040');
          newForms['1040'] = { ...newForms['1040'], ...form1040Data };

          // Auto-fill Schedule A
          const scheduleAData = mapDocumentToForm(doc.extracted_data, 'schedule_a');
          newForms['schedule_a'] = { ...newForms['schedule_a'], ...scheduleAData };

          // Auto-fill Schedule C
          const scheduleCData = mapDocumentToForm(doc.extracted_data, 'schedule_c');
          newForms['schedule_c'] = { ...newForms['schedule_c'], ...scheduleCData };

          // Auto-fill W-9
          const w9Data = mapDocumentToForm(doc.extracted_data, 'w9');
          newForms['w9'] = { ...newForms['w9'], ...w9Data };
        }
      });

      setForms(newForms);
      setMessage('Forms auto-filled from uploaded documents!');
    } catch (err) {
      setError('Failed to auto-fill forms');
    } finally {
      setLoading(false);
    }
  };

  const calculateTax = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await api.post('/tax/calculate', {
        form_1040: forms['1040'] || {},
        schedule_a: forms['schedule_a'] || {},
        schedule_c: forms['schedule_c'] || {},
        filing_status: "single",
        state: "CA"
      });
      setCalculation(response.data);
      setMessage('Tax calculation completed!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Tax calculation failed');
    } finally {
      setLoading(false);
    }
  };

  const saveForm = async (formType) => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await api.post('/tax/save-form', {
        form_type: formType,
        form_data: forms[formType] || {}
      });
      setMessage(`${formType.toUpperCase()} form saved successfully!`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (formType, field, value) => {
    setForms(prev => ({
      ...prev,
      [formType]: {
        ...prev[formType],
        [field]: value
      }
    }));
  };

  const renderForm1040 = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Income Information
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Wages (W-2)"
          type="number"
          value={forms['1040'].wages || ''}
          onChange={(e) => handleFormChange('1040', 'wages', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Business Income (1099-NEC)"
          type="number"
          value={forms['1040'].business_income || ''}
          onChange={(e) => handleFormChange('1040', 'business_income', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Interest Income"
          type="number"
          value={forms['1040'].interest_income || ''}
          onChange={(e) => handleFormChange('1040', 'interest_income', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Dividend Income"
          type="number"
          value={forms['1040'].dividend_income || ''}
          onChange={(e) => handleFormChange('1040', 'dividend_income', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Withholdings
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Federal Tax Withheld"
          type="number"
          value={forms['1040'].federal_withholding || ''}
          onChange={(e) => handleFormChange('1040', 'federal_withholding', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="State Tax Withheld"
          type="number"
          value={forms['1040'].state_withholding || ''}
          onChange={(e) => handleFormChange('1040', 'state_withholding', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          onClick={() => saveForm('1040')}
          disabled={loading}
          startIcon={<Save />}
        >
          Save Form 1040
        </Button>
      </Grid>
    </Grid>
  );

  const renderScheduleA = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Itemized Deductions
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Medical and Dental Expenses"
          type="number"
          value={forms['schedule_a'].medical_expenses || ''}
          onChange={(e) => handleFormChange('schedule_a', 'medical_expenses', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="State and Local Taxes"
          type="number"
          value={forms['schedule_a'].state_local_taxes || ''}
          onChange={(e) => handleFormChange('schedule_a', 'state_local_taxes', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Mortgage Interest"
          type="number"
          value={forms['schedule_a'].mortgage_interest || ''}
          onChange={(e) => handleFormChange('schedule_a', 'mortgage_interest', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Charitable Contributions"
          type="number"
          value={forms['schedule_a'].charitable_contributions || ''}
          onChange={(e) => handleFormChange('schedule_a', 'charitable_contributions', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          onClick={() => saveForm('schedule_a')}
          disabled={loading}
          startIcon={<Save />}
        >
          Save Schedule A
        </Button>
      </Grid>
    </Grid>
  );

  const renderScheduleC = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Business Income and Expenses
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Gross Receipts"
          type="number"
          value={forms['schedule_c'].gross_receipts || ''}
          onChange={(e) => handleFormChange('schedule_c', 'gross_receipts', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Business Expenses"
          type="number"
          value={forms['schedule_c'].business_expenses || ''}
          onChange={(e) => handleFormChange('schedule_c', 'business_expenses', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Home Office Deduction"
          type="number"
          value={forms['schedule_c'].home_office || ''}
          onChange={(e) => handleFormChange('schedule_c', 'home_office', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Vehicle Expenses"
          type="number"
          value={forms['schedule_c'].vehicle_expenses || ''}
          onChange={(e) => handleFormChange('schedule_c', 'vehicle_expenses', parseFloat(e.target.value) || 0)}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          onClick={() => saveForm('schedule_c')}
          disabled={loading}
          startIcon={<Save />}
        >
          Save Schedule C
        </Button>
      </Grid>
    </Grid>
  );

  const renderW9Form = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          W-9 Request for Taxpayer Identification Number
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Name"
          value={forms['w9'].name || ''}
          onChange={(e) => handleFormChange('w9', 'name', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Business Name"
          value={forms['w9'].business_name || ''}
          onChange={(e) => handleFormChange('w9', 'business_name', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Federal Tax Classification"
          value={forms['w9'].tax_classification || ''}
          onChange={(e) => handleFormChange('w9', 'tax_classification', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Address"
          value={forms['w9'].address || ''}
          onChange={(e) => handleFormChange('w9', 'address', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="City"
          value={forms['w9'].city || ''}
          onChange={(e) => handleFormChange('w9', 'city', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="State"
          value={forms['w9'].state || ''}
          onChange={(e) => handleFormChange('w9', 'state', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="ZIP Code"
          value={forms['w9'].zip_code || ''}
          onChange={(e) => handleFormChange('w9', 'zip_code', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Taxpayer ID (SSN or EIN)"
          value={forms['w9'].taxpayer_id || ''}
          onChange={(e) => handleFormChange('w9', 'taxpayer_id', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Account Numbers (optional)"
          value={forms['w9'].account_numbers || ''}
          onChange={(e) => handleFormChange('w9', 'account_numbers', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <Button
          variant="contained"
          onClick={() => saveForm('w9')}
          disabled={loading}
          startIcon={<Save />}
        >
          Save W-9 Form
        </Button>
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tax Forms
      </Typography>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          onClick={autoFillFromDocuments}
          disabled={loading || uploadedDocs.length === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
        >
          Auto-Fill from Documents
        </Button>
        <Button
          variant="outlined"
          onClick={calculateTax}
          disabled={loading}
          startIcon={<Calculate />}
        >
          Calculate Tax
        </Button>
        <Chip 
          label={`${uploadedDocs.length} Documents Available`} 
          color={uploadedDocs.length > 0 ? 'success' : 'default'}
        />
      </Box>

      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tax Calculation Results */}
      {calculation && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tax Calculation Results
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="primary">
                    ${calculation.total_income?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2">Total Income</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="secondary">
                    ${calculation.total_deductions?.toFixed(2) || calculation.deductions?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2">Total Deductions</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color="error">
                    ${calculation.tax_owed?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2">Tax Owed</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6" color={calculation.refund_amount > 0 ? 'success.main' : 'error'}>
                    ${Math.abs(calculation.refund_amount || calculation.amount_due || 0).toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    {calculation.refund_amount > 0 ? 'Refund' : 'Amount Due'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Form Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Form 1040" />
            <Tab label="Schedule A" />
            <Tab label="Schedule C" />
            <Tab label="W-9 Form" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          {renderForm1040()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderScheduleA()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {renderScheduleC()}
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          {renderW9Form()}
        </TabPanel>
      </Card>
    </Box>
  );
}

export default TaxForms;