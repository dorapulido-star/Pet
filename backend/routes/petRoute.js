import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  createPet,
  getAllPets,
  getOnePet,
  getPetsByOwner,
  updatePet,
  deletePet,
  getPetImage
} from '../controller/petController.js';

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
    const uniqueName = `pet-${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
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

// IMPORTANTE: El orden de las rutas importa
// Las rutas más específicas deben ir primero

// Rutas adicionales (más específicas)
route.get('/pets/owner/:ownerId', getPetsByOwner); // Obtener mascotas por dueño

// Rutas principales CRUD
route.post('/pets', upload.single('petPhoto'), createPet);
route.get('/pets', getAllPets);
route.get('/pets/:id', getOnePet);
route.put('/pets/:id', upload.single('petPhoto'), updatePet);
route.delete('/pets/:id', deletePet);

// Ruta para obtener imagen
route.get('/pets/:id/image', getPetImage); // Obtener imagen de mascota

export default route;