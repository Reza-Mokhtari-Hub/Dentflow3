const fs = require('fs');

const routes = `
app.post("/api/send-email", authenticateAdmin, async (req, res) => {
  const { to, subject, text } = req.body;
  const success = await sendEmail(to, subject, text);
  if (success) res.json({ success: true });
  else res.status(500).json({ error: "Failed" });
});

app.post("/api/patient/send-message", async (req, res) => {
  const data = req.body;
  data.id = Math.random().toString(36).substr(2, 9);
  data.date = new Date().toISOString();
  data.status = "unread";
  await new Message(data).save();
  res.json({ success: true });
});

app.post("/api/admin/send-chat", authenticateAdmin, async (req, res) => {
  const data = req.body;
  data.id = Math.random().toString(36).substr(2, 9);
  data.date = new Date().toISOString();
  data.status = "read";
  await new Message(data).save();
  res.json({ success: true });
});

app.get("/api/patient/chat/:email", async (req, res) => {
  const email = req.params.email;
  const messages = await Message.find({ email }).lean();
  res.json(messages);
});

app.post("/api/patient/submit-review", async (req, res) => {
  const data = req.body;
  data.id = Date.now();
  data.status = "pending";
  await new Testimonial(data).save();
  res.json({ success: true });
});

app.post("/api/admin/mark-chat-read", authenticateAdmin, async (req, res) => {
  const { email } = req.body;
  await Message.updateMany({ email }, { status: "read" });
  res.json({ success: true });
});
`;

let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace('// Fallback to Vite', routes + '\n\n// Fallback to Vite');
fs.writeFileSync('server.ts', code);
