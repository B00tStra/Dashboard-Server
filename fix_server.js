import fs from 'fs';
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace(
  "app.get('*', (req, res) => {",
  "app.use((req, res, next) => {"
);
code = code.replace(
  "res.sendFile(path.join(distPath, 'index.html'));\n    }\n  });",
  "res.sendFile(path.join(distPath, 'index.html'));\n    } else { next(); }\n  });"
);
fs.writeFileSync('server.js', code);
console.log('Server-Routing erfolgreich repariert!');
