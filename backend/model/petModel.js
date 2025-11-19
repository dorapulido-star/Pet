import mongoose from "mongoose";

const PetSchema = new mongoose.Schema({
  // Nombre de la mascota
  petName: {
    type: String,
    required: true,
    maxlength: 100
  },
  // Especie de la mascota (perro, gato, conejo, etc.)
  petSpecies: {
    type: String,
    required: true,
    maxlength: 50
  },
  // Raza de la mascota
  petBreed: {
    type: String,
    required: true,
    maxlength: 50
  },
  // Edad de la mascota en años
  petAge: {
    type: Number,
    required: true
  },
  // Género de la mascota
  petGender: {
    type: String,
    required: true,
    enum: ['male', 'female'], // Solo permite estos dos valores
    maxlength: 10
  },
  // URL o ruta de la foto de la mascota
  petPhoto: {
    type: String,
    required: true
  },
  // Referencia al dueño de la mascota
  associatedPetOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PetOwner', // Referencia al modelo de dueños para vincular mascotas con sus propietarios
    required: true // Obligatorio, ya que toda mascota debe tener un dueño registrado
  },
  // Recomendaciones especiales para el cuidado de la mascota (alergias, medicamentos, comportamiento, etc.)
  specialRecommendations: {
    type: String,
    required: false, // Opcional, ya que no todas las mascotas necesitan recomendaciones especiales
    maxlength: 500
  }
}, {
  timestamps: true // Agrega automáticamente createdAt y updatedAt
});

export default mongoose.model('Pet', PetSchema);