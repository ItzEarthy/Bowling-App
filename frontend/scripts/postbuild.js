const fs = require('fs');
const path = require('path');

const distIndex = path.join(__dirname, '..', 'dist', 'index.html');
let content = fs.readFileSync(distIndex, 'utf8');

// Remove any link tags that reference manifest.webmanifest or /manifest.webmanifest
content = content.replace(/<link[^>]+rel="manifest"[^>]*>/gi, '');

fs.writeFileSync(distIndex, content, 'utf8');
console.log('postbuild: removed manifest link(s) from dist/index.html');
