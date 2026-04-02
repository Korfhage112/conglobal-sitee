const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

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
const BOT_TOKEN = "8565717097:AAGpHQVR69-cbHDYHUzB4uShs2AO_4AprfE";
const CHAT_ID = "7130815599";

/* ================= EMAIL ================= */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'katesteward34@gmail.com',
    pass: 'aolh tfpk vvbt dyis'
  }
});

/* ================= MIDDLEWARE ================= */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

/* ================= TEMP STORAGE ================= */
let applications = [];

/* ================= APPLY ================= */
app.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, position } = req.body;
    const file = req.file;

    applications.push({
      name,
      email,
      position,
      file: file ? file.filename : null,
      date: new Date().toLocaleString()
    });

    /* ===== EMAIL ===== */
    await transporter.sendMail({
      from: 'Job Portal',
      to: 'YOUR_EMAIL@gmail.com',
      subject: 'New Job Application',
      text: `Name: ${name}\nEmail: ${email}\nPosition: ${position}`,
      attachments: file
        ? [{ filename: file.originalname, path: file.path }]
        : []
    });

    /* ===== TELEGRAM TEXT ===== */
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `📩 New Application\n\n👤 ${name}\n📧 ${email}\n💼 ${position}`
      })
    });

    res.send("Application submitted successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error submitting application");
  }
});

/* ================= ADMIN ================= */
app.get('/admin', (req, res) => {
  let html = `
  <h1>Applications Dashboard</h1>
  <table border="1" cellpadding="10">
    <tr>
      <th>Name</th>
      <th>Email</th>
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
        <td>${a.position}</td>
        <td>${a.file ? `<a href="/uploads/${a.file}" target="_blank">View</a>` : 'N/A'}</td>
        <td>${a.date}</td>
      </tr>
    `;
  });

  html += `</table>`;
  res.send(html);
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
