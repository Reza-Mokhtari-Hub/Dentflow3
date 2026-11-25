const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const errHandler = `
// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (req.path.startsWith("/api/")) {
    res.status(500).json({ error: "Internal Server Error" });
  } else {
    next(err);
  }
});
`;

code = code.replace('// Fallback to Vite', errHandler + '\n// Fallback to Vite');
fs.writeFileSync('server.ts', code);
