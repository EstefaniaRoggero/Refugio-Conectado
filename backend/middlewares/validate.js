import { validationResult } from 'express-validator';
import { error } from '../utils/apiResponse.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, 'Datos inválidos', 400, errors.array().map((e) => ({ campo: e.path, mensaje: e.msg })));
  }
  next();
};
