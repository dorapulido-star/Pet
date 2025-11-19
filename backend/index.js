import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dogWalkerRoute from "./routes/dogWalkerRoute.js";
import petOwnerRoute from "./routes/petOwnerRoute.js";
import petRoute from "./routes/petRoute.js";
import petWalkingRoute from "./routes/petWalkingRoute.js";

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Crear una instancia de la aplicación Express
const app = express();

// Cargar variables de entorno desde .env
dotenv.config();

// Middleware
app.use(express.json()); // Para parsear JSON en las peticiones
app.use(cors()); // Habilitar CORS para permitir peticiones desde diferentes orígenes

// IMPORTANTE: Servir archivos estáticos de la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Definir el puerto del servidor
const PORT = process.env.PORT || 5001; // Cambiado a 5001 para coincidir con tu configuración
// Definir la URL de conexión a MongoDB desde las variables de entorno
const MONGODB_URL = process.env.MONGOURL;

// Conectar a MongoDB usando mongoose
mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("DB connected successfully");

  // Usar las rutas definidas para paseadores, propietarios, mascotas y paseos
  app.use("/api", dogWalkerRoute);
  app.use("/api", petOwnerRoute);
  app.use("/api", petRoute);
  app.use("/api", petWalkingRoute);
  
  // Ruta de prueba para verificar que el servidor está funcionando
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API de Paseadores de Perros, Propietarios, Mascotas y Paseos funcionando',
      endpoints: {
        dogWalkers: {
          'GET /api/dog-walkers': 'Obtener todos los paseadores',
          'POST /api/dog-walkers': 'Crear nuevo paseador (con imagen)',
          'GET /api/dog-walkers/:id': 'Obtener un paseador',
          'PUT /api/dog-walkers/:id': 'Actualizar paseador (con imagen opcional)',
          'DELETE /api/dog-walkers/:id': 'Eliminar paseador',
          'GET /api/dog-walkers/:id/image': 'Obtener imagen del paseador'
        },
        petOwners: {
          'GET /api/pet-owners': 'Obtener todos los propietarios',
          'POST /api/pet-owners': 'Crear nuevo propietario (con imagen)',
          'GET /api/pet-owners/:id': 'Obtener un propietario',
          'PUT /api/pet-owners/:id': 'Actualizar propietario (con imagen opcional)',
          'DELETE /api/pet-owners/:id': 'Eliminar propietario',
          'GET /api/pet-owners/:id/image': 'Obtener imagen del propietario'
        },
        pets: {
          'GET /api/pets': 'Obtener todas las mascotas',
          'POST /api/pets': 'Crear nueva mascota (con imagen y asociación a dueño)',
          'GET /api/pets/:id': 'Obtener una mascota',
          'GET /api/pets/owner/:ownerId': 'Obtener todas las mascotas de un dueño',
          'PUT /api/pets/:id': 'Actualizar mascota (con imagen opcional)',
          'DELETE /api/pets/:id': 'Eliminar mascota',
          'GET /api/pets/:id/image': 'Obtener imagen de la mascota'
        },
        petWalkings: {
          'GET /api/pet-walkings': 'Obtener todos los paseos',
          'POST /api/pet-walkings': 'Crear nuevo paseo (asignación de turnos)',
          'GET /api/pet-walkings/:id': 'Obtener un paseo específico',
          'PUT /api/pet-walkings/:id': 'Actualizar paseo completo',
          'DELETE /api/pet-walkings/:id': 'Eliminar paseo',
          'PATCH /api/pet-walkings/:id/status': 'Actualizar solo el estado del paseo',
          'GET /api/pet-walkings/date/:date': 'Obtener paseos por fecha (AAAA-MM-DD)',
          'GET /api/pet-walkings/pet/:petId': 'Obtener paseos de una mascota específica',
          'GET /api/pet-walkings/dog-walker/:dogWalkerId': 'Obtener paseos de un paseador específico'
        },
        static: {
          'GET /uploads/[filename]': 'Obtener archivo estático de imagen'
        }
      },
      dataModels: {
        Pet: {
          petName: 'string (required, max 100)',
          petSpecies: 'string (required, max 50)',
          petBreed: 'string (required, max 50)',
          petAge: 'number (required)',
          petGender: 'string (required, enum: ["male", "female"])',
          petPhoto: 'string (required)',
          associatedPetOwner: 'ObjectId (required, ref: PetOwner)',
          specialRecommendations: 'string (optional, max 500)'
        },
        PetOwner: {
          ownerName: 'string (required, max 100)',
          ownerPhone: 'number (required)',
          ownerAddress: 'string (required, max 50)',
          ownerEmail: 'string (required, max 50)',
          ownerPhoto: 'string (required)'
        },
        DogWalker: {
          walkerName: 'string (required)',
          walkerPhone: 'string (required)',
          walkerEmail: 'string (required)',
          walkerAddress: 'string (required)',
          walkerPhoto: 'string (required)',
          walkerExperience: 'number (optional)'
        },
        PetWalking: {
          walkingDate: 'Date (required, formato AAAA-MM-DD)',
          walkingStartTime: 'string (required, formato HH:MM)',
          walkingDuration: 'number (required, 0.5-8 horas)',
          associatedPet: 'ObjectId (required, ref: Pet)',
          associatedDogWalker: 'ObjectId (required, ref: DogWalker)',
          walkingNotes: 'string (required, max 250 - novedades del paseo)',
          walkingStatus: 'string (enum: ["scheduled", "in_progress", "completed", "cancelled"])',
          walkingEndTime: 'string (calculado automáticamente, formato HH:MM)',
          adminNotes: 'string (optional, max 500)'
        }
      },
      businessRules: {
        petWalkings: {
          scheduling: 'No se pueden programar paseos en fechas pasadas',
          duration: 'Duración mínima: 0.5 horas, máxima: 8 horas',
          conflicts: 'El sistema verifica conflictos de horario para paseadores',
          statusTransitions: {
            scheduled: ['in_progress', 'cancelled'],
            in_progress: ['completed', 'cancelled'],
            completed: [],
            cancelled: ['scheduled']
          },
          deletion: 'Solo se pueden eliminar paseos con estado "scheduled" o "cancelled"'
        },
        relationships: {
          petToPetOwner: 'Cada mascota debe estar asociada a un propietario',
          petWalkingToPet: 'Cada paseo debe estar asociado a una mascota',
          petWalkingToDogWalker: 'Cada paseo debe estar asociado a un paseador'
        }
      }
    });
  });

  // Manejo de errores 404 - Rutas no encontradas
  app.use((req, res) => {
    res.status(404).json({ 
      message: 'Ruta no encontrada',
      path: req.originalUrl,
      availableEndpoints: [
        '/api/dog-walkers',
        '/api/pet-owners',
        '/api/pets',
        '/api/pet-walkings'
      ]
    });
  });

  // Iniciar el servidor
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    console.log(`Uploads folder: ${path.join(__dirname, 'uploads')}`);
    console.log('');
    console.log('Endpoints disponibles:');
    console.log('- Dog Walkers: /api/dog-walkers');
    console.log('- Pet Owners: /api/pet-owners');
    console.log('- Pets: /api/pets');
    console.log('- Pet Walkings: /api/pet-walkings');
    console.log('- Static files: /uploads');
    console.log('');
    console.log('Relaciones:');
    console.log('- Cada mascota debe estar asociada a un propietario (associatedPetOwner)');
    console.log('- Un propietario puede tener múltiples mascotas');
    console.log('- Cada paseo debe estar asociado a una mascota (associatedPet)');
    console.log('- Cada paseo debe estar asociado a un paseador (associatedDogWalker)');
    console.log('- Un paseador puede tener múltiples paseos');
    console.log('- Una mascota puede tener múltiples paseos');
    console.log('');
    console.log('Funcionalidades de Pet Walkings:');
    console.log('- ✅ Asignación de turnos para paseos (Requerimiento R13)');
    console.log('- ✅ Validación de conflictos de horario para paseadores');
    console.log('- ✅ Control de estados de paseos');
    console.log('- ✅ Consultas por fecha, mascota y paseador');
  });
}).catch(error => {
  console.log("Error connecting to MongoDB:", error);
});