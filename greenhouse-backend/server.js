
const express = require('express');
const cors = require('cors');

const greenhouseRoutes = require('./src/routes/greenhouseRoutes');
const notFound = require('./src/middleware/notFound');
const errorHandler = require('./src/middleware/errorHandler');
const { restoreActuatorStates } = require('./src/services/greenhouseService');
const { startRuleEngineJob } = require('./src/jobs/ruleEngineJob');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/v1', greenhouseRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
  const startServer = async () => {
    try {
      const restoredCount = await restoreActuatorStates();

      console.log(`Đã khôi phục trạng thái ${restoredCount} thiết bị từ PostgreSQL.`);

      app.listen(PORT, () => {
        console.log(`Smart Greenhouse Backend đang chạy tại: http://localhost:${PORT}`);
        startRuleEngineJob();
      });
    } catch (error) {
      console.error('Không thể khôi phục trạng thái thiết bị:', error);
      process.exit(1);
    }
  };

  startServer();
}

module.exports = app;
