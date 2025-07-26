import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper
} from '@mui/material';
import { CloudUpload, Description } from '@mui/icons-material';
import api from '../utils/api';
import { getDocumentTypeDisplayName } from '../utils/formMapping';

function DocumentUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: true
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return response.data;
      });

      const results = await Promise.all(uploadPromises);
      setUploadedDocs(prev => [...prev, ...results]);
      setFiles([]);
      setMessage(`Successfully uploaded ${results.length} document(s)`);
      
      // Reload documents to get the latest list
      await loadUserDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const loadUserDocuments = async () => {
    try {
      const response = await api.get('/files/user-documents');
      setUploadedDocs(response.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
      setUploadedDocs([]); // Set empty array on error
    }
  };

  const handleDownload = async (doc) => {
    try {
      const response = await api.get(`/files/download/${doc.id}`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Download failed');
    }
  };

  React.useEffect(() => {
    loadUserDocuments();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Document Upload
      </Typography>
      
      {/* Upload Area */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Paper
            {...getRootProps()}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: PDF, PNG, JPG, JPEG
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported documents: W-2, 1099-NEC, W-9
            </Typography>
          </Paper>

          {/* Selected Files */}
          {files.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Selected Files ({files.length})
              </Typography>
              <List>
                {files.map((file, index) => (
                  <ListItem key={index} sx={{ border: '1px solid', borderColor: 'grey.300', mb: 1, borderRadius: 1 }}>
                    <Description sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                    />
                    <Button
                      size="small"
                      color="error"
                      onClick={() => removeFile(index)}
                    >
                      Remove
                    </Button>
                  </ListItem>
                ))}
              </List>
              
              <Button
                variant="contained"
                onClick={uploadFiles}
                disabled={uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                sx={{ mt: 2 }}
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </Box>
          )}

          {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </CardContent>
      </Card>

      {/* Uploaded Documents */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Uploaded Documents ({uploadedDocs.length})
          </Typography>
          
          {uploadedDocs.length === 0 ? (
            <Typography color="text.secondary">
              No documents uploaded yet.
            </Typography>
          ) : (
            <List>
              {uploadedDocs.map((doc) => (
                <ListItem key={doc.id} sx={{ border: '1px solid', borderColor: 'grey.300', mb: 1, borderRadius: 1 }}>
                  <Description sx={{ mr: 2, color: 'primary.main' }} />
                  <ListItemText
                    primary={doc.filename || 'Unknown filename'}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Uploaded: {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                        {(doc.extracted_data || doc.document_type) && (
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={getDocumentTypeDisplayName(
                                doc.extracted_data?.document_type || doc.document_type || 'Unknown'
                              )}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            {(doc.extracted_data?.document_type === 'W-2' || doc.document_type === 'W-2') && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                Wages: ${doc.extracted_data?.wages || 0}
                              </Typography>
                            )}
                            {(doc.extracted_data?.document_type === '1099-NEC' || doc.document_type === '1099-NEC') && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                Compensation: ${doc.extracted_data?.nonemployee_compensation || 0}
                              </Typography>
                            )}
                            {(doc.extracted_data?.document_type === 'W-9' || doc.document_type === 'W-9') && (
                              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                Name: {doc.extracted_data?.name || 'N/A'}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDownload(doc)}
                  >
                    Download
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default DocumentUpload;