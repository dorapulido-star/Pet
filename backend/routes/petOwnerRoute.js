import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  createPetOwner,
  getAllPetOwners,
  getOnePetOwner,
  updatePetOwner,
  deletePetOwner,
  getPetOwnerImage
} from '../controller/petOwnerController.js';

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

// Rutas principales CRUD
route.post('/pet-owners', upload.single('ownerPhoto'), createPetOwner);
route.get('/pet-owners', getAllPetOwners);
route.get('/pet-owners/:id', getOnePetOwner);
route.put('/pet-owners/:id', upload.single('ownerPhoto'), updatePetOwner);
route.delete('/pet-owners/:id', deletePetOwner);

// Rutas para manejo de imágenes
route.get('/pet-owners/:id/image', getPetOwnerImage);

export default route;