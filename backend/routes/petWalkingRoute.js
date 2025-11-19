import express from 'express';
import {
  createPetWalking,
  getAllPetWalkings,
  getOnePetWalking,
  getPetWalkingsByDate,
  getPetWalkingsByPet,
  getPetWalkingsByDogWalker,
  updatePetWalking,
  deletePetWalking,
  updatePetWalkingStatus
} from '../controller/petWalkingController.js';

const route = express.Router();

// IMPORTANTE: El orden de las rutas importa
// Las rutas más específicas deben ir primero

// Rutas específicas (más específicas primero)
route.get('/pet-walkings/date/:date', getPetWalkingsByDate); // Obtener paseos por fecha específica
route.get('/pet-walkings/pet/:petId', getPetWalkingsByPet); // Obtener paseos por mascota
route.get('/pet-walkings/dog-walker/:dogWalkerId', getPetWalkingsByDogWalker); // Obtener paseos por paseador
route.patch('/pet-walkings/:id/status', updatePetWalkingStatus); // Actualizar solo el estado del paseo

// Rutas principales CRUD
route.post('/pet-walkings', createPetWalking); // Crear nuevo paseo
route.get('/pet-walkings', getAllPetWalkings); // Obtener todos los paseos
route.get('/pet-walkings/:id', getOnePetWalking); // Obtener un paseo específico
route.put('/pet-walkings/:id', updatePetWalking); // Actualizar paseo completo
route.delete('/pet-walkings/:id', deletePetWalking); // Eliminar paseo

export default route;