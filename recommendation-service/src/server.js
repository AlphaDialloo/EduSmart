require('dotenv').config();
const express = require('express'),
  cors = require('cors'),
  helmet = require('helmet'),
  morgan = require('morgan');
const routes = require('./routes/recommendation.routes');
const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.get('/health', (_, res) => res.json({
  service: 'recommendation-service',
  status: 'OK'
}));
app.use('/recommendations', routes);
app.use('/api/recommendations', routes);
app.listen(process.env.PORT || 4005, () => console.log('Recommendation Service lancé'));
