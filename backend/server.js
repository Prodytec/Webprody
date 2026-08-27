const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/utils/logger');

app.listen(env.port, () => {
  logger.info(`Servidor Prodytec escuchando en http://localhost:${env.port}`);
});
