
const express = require('express');
const cors = require('cors');

const greenhouseRoutes = require('./src/routes/greenhouseRoutes');
const notFound = require('./src/middleware/notFound');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/v1', greenhouseRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Smart Greenhouse Backend đang chạy tại: http://localhost:${PORT}`);
  });
}

module.exports = app;
