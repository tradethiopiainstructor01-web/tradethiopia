const express = require('express');
const app = express();
app.put('/:id', (req, res) => {
  res.send('id route');
});
app.put('/:id/assign', (req, res) => {
  res.send('assign route');
});
const server = app.listen(5001, () => {
  console.log('server running on port 5001');
});
setTimeout(() => server.close(() => console.log('server closed')), 2000);
