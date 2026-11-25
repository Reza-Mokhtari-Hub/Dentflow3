const fs = require('fs');

const oldCode = fs.readFileSync('/tmp/server.ts', 'utf8');
let newCode = fs.readFileSync('server.ts', 'utf8');

const extractRoute = (pathPattern) => {
  const match = oldCode.match(new RegExp(`app\\.(post|put|delete|get)\\("${pathPattern}"[\\s\\S]*?\\}\\);`));
  return match ? match[0] : null;
};

const missingRoutes = [
  "/api/send-email",
  "/api/patient/send-message",
  "/api/admin/send-chat",
  "/api/patient/chat/:email",
  "/api/patient/submit-review",
  "/api/admin/mark-chat-read"
];

let toAppend = "\n// --- Additional extracted routes ---\n";

missingRoutes.forEach(route => {
  const code = extractRoute(route);
  if (code) {
    toAppend += code + "\n\n";
  } else {
    console.warn("Could not find route:", route);
  }
});

// Insert before fallback to Vite
newCode = newCode.replace('// Fallback to Vite', toAppend + '\n// Fallback to Vite');

// Fix old code references in appended routes
toAppend = toAppend.replace(/messages\.push/g, '// messages.push');
toAppend = toAppend.replace(/persistState\(\);/g, '');
toAppend = toAppend.replace(/let message = messages/g, 'let message = await Message');

// I will just replace the file with a much more robust manual script to ensure I don't break logic.
