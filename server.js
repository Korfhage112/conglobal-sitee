// server.js
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 3000;

/* ================= STORAGE ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

/* ================= TELEGRAM ================= */
const BOT_TOKEN = process.env.BOT_TOKEN || "8565717097:AAGpHQVR69-cbHDYHUzB4uShs2AO_4AprfE";
const CHAT_ID = process.env.CHAT_ID || "7130815599";

/* ================= EMAIL ================= */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'katesteward34@gmail.com',
    pass: process.env.GMAIL_PASS || 'aolh tfpk vvbt dyis'
  }
});

/* ================= MIDDLEWARE ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

/* ================= TEMP STORAGE ================= */
let applications = [];

/* ================= APPLY ROUTE ================= */
app.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone, position } = req.body;
    const file = req.file;

    // Save application to memory
    applications.push({
      name,
      email,
      phone,
      position,
      file: file ? file.filename : null,
      date: new Date().toLocaleString()
    });

    /* ===== SEND EMAIL ===== */
    await transporter.sendMail({
      from: 'Job Portal',
      to: process.env.GMAIL_USER || 'YOUR_EMAIL@gmail.com',
      subject: 'New Job Application',
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nPosition: ${position}`,
      attachments: file ? [{ filename: file.originalname, path: file.path }] : []
    });

    /* ===== SEND TELEGRAM ===== */
    // Send text
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: `📩 New Application\n\n👤 ${name}\n📧 ${email}\n📞 ${phone}\n💼 ${position}`
    });

    // Send resume file if uploaded
    if (file) {
      const form = new FormData();
      form.append('chat_id', CHAT_ID);
      form.append('document', fs.createReadStream(file.path));

      await axios.post(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
        form,
        { headers: form.getHeaders() }
      );

      // delete temp file
      fs.unlinkSync(file.path);
    }

    // ✅ Show success page
    res.sendFile(path.join(__dirname, 'success.html'));

    // Optional: to show thankyou page instead, replace above line with:
    // res.sendFile(path.join(__dirname, 'thankyou.html'));

  } catch (err) {
    console.error(err);
    res.status(500).send("Error submitting application");
  }
});

/* ================= ADMIN DASHBOARD ================= */
app.get('/admin', (req, res) => {
  let html = `
    <h1>Applications Dashboard</h1>
    <table border="1" cellpadding="10">
      <tr>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Position</th>
        <th>Resume</th>
        <th>Date</th>
      </tr>
  `;

  applications.forEach(a => {
    html += `
      <tr>
        <td>${a.name}</td>
        <td>${a.email}</td>
        <td>${a.phone}</td>
        <td>${a.position}</td>
        <td>${a.file ? `<a href="/uploads/${a.file}" target="_blank">View</a>` : 'N/A'}</td>
        <td>${a.date}</td>
      </tr>
    `;
  });

  html += `</table>`;
  res.send(html);
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
