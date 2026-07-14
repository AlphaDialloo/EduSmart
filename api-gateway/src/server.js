require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.get('/health', (_, res) => {
  res.json({
    service: 'api-gateway',
    status: 'OK'
  });
});

const proxy = (publicPath, target, servicePath) => {
  if (!target) {
    throw new Error(`URL manquante pour ${publicPath}`);
  }

  app.use(
    publicPath,
    createProxyMiddleware({
      target: `${target}${servicePath}`,
      changeOrigin: true
    })
  );
};

proxy('/api/auth', process.env.AUTH_SERVICE_URL, '/auth');
proxy('/api/users', process.env.USER_SERVICE_URL, '/users');
proxy('/api/courses', process.env.COURSE_SERVICE_URL, '/courses');
proxy('/api/progress', process.env.PROGRESS_SERVICE_URL, '/progress');
proxy('/api/recommendations', process.env.RECOMMENDATION_SERVICE_URL, '/recommendations');
proxy('/api/interactions', process.env.INTERACTION_SERVICE_URL, '/interactions');

app.listen(process.env.PORT || 3000, () => {
  console.log('API Gateway lancée');
});