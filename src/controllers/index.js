import express from 'express';
import AuthController from './AuthController.js';

const controllers = express.Router();
controllers.use('/auth', AuthController);

export default controllers;