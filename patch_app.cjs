const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove localStorage usages
code = code.replace(/const saved = localStorage\.getItem\("df_patients"\);\s*if \(saved\) return JSON\.parse\(saved\);/g, '');
code = code.replace(/const saved = localStorage\.getItem\("df_transactions"\);\s*if \(saved\) return JSON\.parse\(saved\);/g, '');
code = code.replace(/const saved = localStorage\.getItem\("df_testimonials"\);\s*if \(saved\) return JSON\.parse\(saved\);/g, '');
code = code.replace(/localStorage\.setItem\("df_patients"[^\)]+\);/g, '');
code = code.replace(/localStorage\.setItem\("df_transactions"[^\)]+\);/g, '');
code = code.replace(/localStorage\.setItem\("df_testimonials"[^\)]+\);/g, '');
code = code.replace(/localStorage\.setItem\("df_local_articles"[^\)]+\);/g, '');
code = code.replace(/localStorage\.setItem\("df_dark_theme"[^\)]+\);/g, '');
code = code.replace(/localStorage\.setItem\("df_bookings"[^\)]+\);/g, '');
code = code.replace(/localStorage\.setItem\("df_use_local_db"[^\)]+\);/g, '');
code = code.replace(/localStorage\.setItem\("df_admin_username"[^\)]+\);/g, '');
code = code.replace(/const saved = localStorage\.getItem\("df_bookings"\);/g, 'const saved = null;');
code = code.replace(/const localArticles = localStorage\.getItem\("df_local_articles"\);/g, 'const localArticles = null;');
code = code.replace(/const useLocal = localStorage\.getItem\("df_use_local_db"\) === "true";/g, 'const useLocal = false;');

fs.writeFileSync('src/App.tsx', code);
