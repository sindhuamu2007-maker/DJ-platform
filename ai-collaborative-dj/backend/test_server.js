const { app, server } = require('./server.js');

setTimeout(() => {
  console.log("Server test succeeded! Closing test server...");
  server.close(() => {
    console.log("Test server closed cleanly.");
    process.exit(0);
  });
}, 3500);
