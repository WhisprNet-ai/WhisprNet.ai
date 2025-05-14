import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import CloudIcon from '@mui/icons-material/Cloud';
import FolderIcon from '@mui/icons-material/Folder';
import EmailIcon from '@mui/icons-material/Email';
import CodeIcon from '@mui/icons-material/Code';
import ForumIcon from '@mui/icons-material/Forum';
import axios from 'axios';

// MCP Integration types and their details
const INTEGRATION_DETAILS = {
  github: {
    title: 'GitHub MCP Integration',
    icon: <CodeIcon />,
    description: 'Connect to GitHub repositories, issues, and pull requests',
    dataTypes: [
      { name: 'Repositories', icon: <FolderIcon /> },
      { name: 'Issues', icon: <ErrorIcon /> },
      { name: 'Pull Requests', icon: <CodeIcon /> },
    ]
  },
  slack: {
    title: 'Slack MCP Integration',
    icon: <ForumIcon />,
    description: 'Access Slack channels, messages, and user data',
    dataTypes: [
      { name: 'Channels', icon: <ForumIcon /> },
      { name: 'Messages', icon: <ForumIcon /> },
      { name: 'Users', icon: <LockIcon /> },
    ]
  },
  email: {
    title: 'Gmail MCP Integration',
    icon: <EmailIcon />,
    description: 'Connect to Gmail for email data analysis',
    dataTypes: [
      { name: 'Emails', icon: <EmailIcon /> },
      { name: 'Contacts', icon: <LockIcon /> },
      { name: 'Attachments', icon: <FolderIcon /> },
    ]
  }
};

const IntegrationConfig = ({ type }) => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    dataAccess: {}
  });

  const details = INTEGRATION_DETAILS[type] || {
    title: 'Integration Configuration',
    description: 'Configure integration settings',
    dataTypes: []
  };

  // Initialize data access permissions
  useEffect(() => {
    if (details.dataTypes) {
      const initialDataAccess = {};
      details.dataTypes.forEach(dataType => {
        initialDataAccess[dataType.name] = false;
      });
      setConfig(prev => ({
        ...prev,
        dataAccess: initialDataAccess
      }));
    }
  }, [type]);

  // Fetch existing configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/organizations/${orgId}/integrations/${type}`);
        
        if (response.data && response.data.mcpConfig) {
          setConfig({
            enabled: response.data.enabled || false,
            dataAccess: response.data.mcpConfig.dataAccess || {}
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching integration config:', err);
        setError('Failed to load integration configuration');
        setLoading(false);
      }
    };

    if (orgId) {
      fetchConfig();
    }
  }, [orgId, type]);

  const handleToggleDataAccess = (dataType) => {
    setConfig({
      ...config,
      dataAccess: {
        ...config.dataAccess,
        [dataType]: !config.dataAccess[dataType]
      }
    });
  };

  const handleToggleEnabled = () => {
    setConfig({
      ...config,
      enabled: !config.enabled
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const payload = {
        enabled: config.enabled,
        mcpConfig: {
          dataAccess: config.dataAccess
        }
      };
      
      await axios.post(`/api/organizations/${orgId}/integrations/${type}/mcp-config`, payload);
      
      setSuccess(true);
      setSaving(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving integration config:', err);
      setError('Failed to save configuration. Please try again.');
      setSaving(false);
    }
  };

  const handleActivateMCP = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // This would trigger the MCP authorization flow
      const response = await axios.post(`/api/organizations/${orgId}/integrations/${type}/activate-mcp`);
      
      // Usually this would open a new window/redirect to the authorization page
      if (response.data && response.data.authUrl) {
        window.open(response.data.authUrl, '_blank');
      }
      
      setSaving(false);
    } catch (err) {
      console.error('Error activating MCP:', err);
      setError('Failed to activate MCP integration. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Button 
        variant="outlined" 
        onClick={() => navigate('/integrations')}
        sx={{ mb: 2 }}
      >
        Back to Integrations
      </Button>
      
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {details.icon}
            <Typography variant="h5" sx={{ ml: 1 }}>
              {details.title}
            </Typography>
          </Box>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {details.description}
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Configuration saved successfully!
            </Alert>
          )}
          
          <FormControlLabel
            control={
              <Switch 
                checked={config.enabled} 
                onChange={handleToggleEnabled}
                color="primary"
              />
            }
            label="Enable Integration"
            sx={{ mb: 2 }}
          />
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            MCP Integration
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CloudIcon sx={{ mr: 1 }} />
            <Typography variant="body1">
              Model Context Protocol allows the LLM to directly access data from {details.title.split(' ')[0]} without storing credentials.
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleActivateMCP}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <CloudIcon />}
            sx={{ mb: 3 }}
          >
            Activate MCP Connection
          </Button>
          
          <Typography variant="h6" sx={{ mb: 2 }}>
            Data Access Permissions
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Control what data the AI can access through MCP
          </Typography>
          
          <List>
            {details.dataTypes.map((dataType) => (
              <ListItem key={dataType.name}>
                <ListItemIcon>
                  {dataType.icon}
                </ListItemIcon>
                <ListItemText primary={dataType.name} />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={config.dataAccess[dataType.name] || false} 
                      onChange={() => handleToggleDataAccess(dataType.name)}
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
            ))}
          </List>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              Save Configuration
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default IntegrationConfig; 