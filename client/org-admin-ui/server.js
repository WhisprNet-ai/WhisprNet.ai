import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3003;

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'dist')));

// Log all requests to help debug
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Special handling for invitation routes
app.get('/invitations/*', (req, res) => {
  console.log('INVITATION ROUTE MATCHED:', req.url);
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Handle all other routes by sending back the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`Invitation route will be handled at http://localhost:${port}/invitations/accept/YOUR_TOKEN`);
  console.log(`Try accessing http://localhost:${port}/invitationTest.html first to verify static files`);
}); 