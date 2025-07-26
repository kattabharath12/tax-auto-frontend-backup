export const mapDocumentToForm = (extractedData, formType) => {
  if (!extractedData) return {};

  switch (formType) {
    case '1040':
      return map1040Data(extractedData);
    case 'schedule_a':
      return mapScheduleAData(extractedData);
    case 'schedule_c':
      return mapScheduleCData(extractedData);
    case 'w9':
      return mapW9Data(extractedData);
    default:
      return {};
  }
};

const map1040Data = (data) => {
  const mapping = {};
  if (data.document_type === 'W-2') {
    mapping.wages = data.wages || 0;
    mapping.federal_withholding = data.federal_withholding || 0;
    mapping.state_withholding = data.state_withholding || 0;
  }
  if (data.document_type === '1099-NEC') {
    mapping.business_income = data.nonemployee_compensation || 0;
    mapping.federal_withholding = data.federal_withholding || 0;
  }
  return mapping;
};

const mapScheduleAData = (data) => ({
  medical_expenses: 0,
  state_local_taxes: data.state_withholding || 0,
  mortgage_interest: 0,
  charitable_contributions: 0
});

const mapScheduleCData = (data) => {
  if (data.document_type === '1099-NEC') {
    return {
      gross_receipts: data.nonemployee_compensation || 0,
      business_expenses: 0,
      home_office: 0
    };
  }
  return {};
};

const mapW9Data = (data) => {
  if (data.document_type === 'W-9') {
    return {
      name: data.name || '',
      business_name: data.business_name || '',
      tax_classification: data.federal_tax_classification || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zip_code: data.zip_code || '',
      taxpayer_id: data.taxpayer_id || '',
      ssn: data.ssn || '',
      ein: data.ein || '',
      account_numbers: data.account_numbers || '',
      requester_name: data.requester_name || '',
      requester_address: data.requester_address || ''
    };
  }
  return {};
};

export const validateFormData = (formData, formType) => {
  const errors = {};
  Object.keys(formData).forEach(key => {
    const value = formData[key];
    if (typeof value === 'string' && value.trim() === '') {
      errors[key] = 'This field is required';
    }
    if (typeof value === 'number' && value < 0) {
      errors[key] = 'Value cannot be negative';
    }
  });
  return errors;
};

export const getDocumentTypeDisplayName = (docType) => {
  const displayNames = {
    'W-2': 'W-2 Wage and Tax Statement',
    '1099-NEC': '1099-NEC Nonemployee Compensation',
    'W-9': 'W-9 Request for Taxpayer ID',
    'Unknown': 'Unknown Document Type'
  };
  return displayNames[docType] || docType;
};