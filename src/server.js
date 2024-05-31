import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import AuthService from './services/AuthService.js';
import controllers from './controllers/index.js';
import CookieService from './services/CookieService.js'

const HOST = process.env.HOST;
const PORT = process.env.PORT;
const NODE_ENV = process.env.NODE_ENV;

/**
 * Initialization
 */
const app = express();
app.set('view engine', 'pug');
app.set('views', path.resolve(import.meta.dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

/**
 * Logging Route
 */
app.use((req, res, next) => {
  console.log(`${NODE_ENV} ${req.method} ${req.path}`, req.body);
  return next();
});

/**
 * Serve up login page
 */
app.get('/', (req, res) => {
  const idToken = req.cookies[CookieService.ID_TOKEN_COOKIE.name];
  if (!idToken) {
    console.log('No ID Token found, sending login page');
    return res.sendFile(path.resolve(import.meta.dirname, 'public', 'login.html'));
  }
  return res.redirect('/profile');
});

app.use('/api', controllers);

app.use(async (req, res, next) => {
  const idToken = req.cookies[CookieService.ID_TOKEN_COOKIE.name];
  if (!idToken) {
    console.log('No id token provided');
    return res.sendStatus(401);
  }

  // Extract user information from ID token
  try {
    const authService = new AuthService();
    const userData = await authService.getUserData(idToken);
    res.locals.user = userData;
    console.log('ID token valid');
    return next();
  } catch (err) {
    console.error('ID token invalid', err);
    res.clearCookie(CookieService.ID_TOKEN_COOKIE.name, CookieService.ID_TOKEN_COOKIE.cookie);
    return res.sendStatus(401);
  }
});

app.get('/profile', (req, res, next) => {
  try {
    const {email, name, picture} = res.locals.user;
    return res.render('profile', {email, name, picture});
  } catch (err) {
    console.error('Error sending profile page', err);
    return next(err);
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});