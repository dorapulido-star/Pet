// ============ dogWalkerRoute.js ============
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  createDogWalker,
  getAllDogWalkers,
  getOneDogWalker,
  updateDogWalker,
  deleteDogWalker,
  getDogWalkerImage
} from '../controller/dogWalkerController.js';

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Asegurar que la carpeta "uploads" existe
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, JPEG y PNG'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const route = express.Router();

// Rutas
route.post('/dog-walkers', upload.single('foto'), createDogWalker);
route.get('/dog-walkers', getAllDogWalkers);
route.get('/dog-walkers/:id', getOneDogWalker);
route.put('/dog-walkers/:id', upload.single('foto'), updateDogWalker);
route.delete('/dog-walkers/:id', deleteDogWalker);
route.get('/dog-walkers/:id/image', getDogWalkerImage);

export default route;