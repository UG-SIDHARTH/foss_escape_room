const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const dotenv = require('dotenv');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'https://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api', routes);

// Serve static frontend in production
app.use(express.static(path.join(__dirname, '../client/dist')));
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

const certPath = path.join(__dirname, '../certs/localhost.pem');
const keyPath = path.join(__dirname, '../certs/localhost-key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  const options = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS Server listening on port ${PORT}`);
  });
} else {
  console.warn('WARNING: SSL certificates not found in ../certs/. Falling back to plain HTTP.');
  app.listen(PORT, () => {
    console.log(`HTTP Server listening on port ${PORT}`);
  });
}
