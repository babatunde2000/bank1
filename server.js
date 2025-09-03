const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
  secret: 'demo-session-secret-key-2025',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/submit-transaction', (req, res) => {
  const transactionData = {
    accountName: req.body.accountName,
    bankName: req.body.bankName,
    accountNumber: req.body.accountNumber,
    phoneNumber: req.body.phoneNumber,
    amount: req.body.amount.replace(/,/g, ''), // Remove commas for processing
    narration: req.body.narration,
    transactionDate: req.body.transactionDate,
    referenceNumber: generateReferenceNumber(),
    submittedAt: new Date().toISOString()
  };

  // Save to session
  req.session.transactionData = transactionData;

  // Generate and log SMS simulation
  const smsText = generateSMS(transactionData);
  console.log('\n=== SMS SIMULATION ===');
  console.log(smsText);
  console.log('=====================\n');

  // Redirect to receipt page
  res.redirect('/receipt');
});

app.get('/receipt', (req, res) => {
  if (!req.session.transactionData) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'receipt.html'));
});

app.get('/details', (req, res) => {
  if (!req.session.transactionData) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'details.html'));
});

// API endpoint to get transaction data
app.get('/api/transaction-data', (req, res) => {
  if (!req.session.transactionData) {
    return res.status(404).json({ error: 'No transaction data found' });
  }
  res.json(req.session.transactionData);
});

function generateReferenceNumber() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 8).toUpperCase();
  return timestamp + random;
}

function generateSMS(data) {
  const formatAmount = (amount) => {
    return parseFloat(amount).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    const hour12 = date.getHours() % 12 || 12;
    
    return `${day}/${month}/${year} ${hour12.toString().padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
  };

  const maskedAccount = data.accountNumber.slice(0, 3) + '****' + data.accountNumber.slice(-3);
  const balance = (parseFloat(data.amount) + Math.random() * 10000 + 1000).toFixed(2);

  return `Acct:${maskedAccount}
DT:${formatDate(data.transactionDate)}
CR/CR//Transfer from ${data.accountName.toUpperCase()}
CR Amt:${formatAmount(data.amount)}
Bal:${formatAmount(balance)}
Dial *966# for quick airtime/Data purchase`;
}

app.listen(PORT, () => {
  console.log(`🚀 Application running on http://localhost:${PORT}`);
  console.log('📝 Educational demo application');
  console.log('⚠️  All transactions are simulations');
});