import app from './app.js';

export default function handler(req: any, res: any) {
  if (req.url) {
    if (req.originalUrl && req.originalUrl.startsWith('/api')) {
      req.url = req.originalUrl;
    } else if (!req.url.startsWith('/api')) {
      req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
  }
  return app(req, res);
}
