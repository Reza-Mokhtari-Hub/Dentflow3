const fs = require('fs');

const code = fs.readFileSync('/tmp/server.ts', 'utf8');

// I will write a script to rewrite `server.ts` to be stateless and use mongoose.
// Actually, this is too complex to script in JS. 
