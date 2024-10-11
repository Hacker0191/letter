const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const letterService = require('./services/letterService');
const axios = require('axios');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

function generateCaptcha() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function requireAuth(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.redirect('/admin/login');
  }
}

app.get('/', (req, res) => {
    res.render('submit'); // No need to generate captcha manually anymore
  });
  
  app.post('/submit', async (req, res) => {
    const { letter, 'g-recaptcha-response': recaptchaResponse } = req.body;
  
    // Validate the reCAPTCHA token by sending a request to Google
    const secretKey = '6LdZwFwqAAAAAFe3LX51gNxI_3VhNghQvPeu4fIc'; // Your secret key
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}&remoteip=${req.connection.remoteAddress}`;
  
    try {
      const response = await axios.post(verifyUrl);
      const { success } = response.data;
  
      if (!success) {
        return res.render('submit', { error: 'Captcha verification failed. Please try again.' });
      }
  
      // Captcha is valid, now proceed with saving the letter
      const code = await letterService.saveLetter(letter);
      res.render('success', { code });
  
    } catch (error) {
      console.error('Error verifying captcha:', error);
      return res.render('submit', { error: 'Captcha verification error. Please try again.' });
    }
  });

app.post('/autosave', async (req, res) => {
  const { letter, code } = req.body;
  let savedCode = code;
  
  if (code) {
    await letterService.updateDraft(code, letter);
  } else {
    savedCode = await letterService.saveLetter(letter, true);
  }
  
  res.json({ success: true, code: savedCode });
});

app.get('/view', (req, res) => {
  res.render('view');
});

app.post('/view', async (req, res) => {
  const code = req.body.code;
  const letterData = await letterService.getLetter(code);
  if (letterData) {
    res.render('display', { letterData });
  } else {
    res.render('view', { error: 'Invalid code. Please try again.' });
  }
});

app.get('/admin/login', (req, res) => {
  res.render('adminLogin');
});

app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'Mayank' && password === 'Mayank@0456') {
    req.session.isAuthenticated = true;
    res.redirect('/admin');
  } else {
    res.render('adminLogin', { error: 'Invalid credentials' });
  }
});

app.get('/admin', requireAuth, async (req, res) => {
  const letters = await letterService.getAllLetters();
  res.render('admin', { letters });
});

app.get('/admin/reply/:code', requireAuth, async (req, res) => {
  const code = req.params.code;
  const letterData = await letterService.getLetter(code);
  if (letterData) {
    res.render('adminReply', { letterData, code });
  } else {
    res.redirect('/admin');
  }
});

app.post('/admin/reply/:code', requireAuth, async (req, res) => {
  const code = req.params.code;
  const reply = req.body.reply;
  const success = await letterService.replyToLetter(code, reply);
  if (success) {
    res.redirect('/admin');
  } else {
    res.status(404).send('Letter not found');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});