import mongoose from "mongoose";

const PetWalkingSchema = new mongoose.Schema({
  // Fecha del paseo (Fecpas)
  walkingDate: {
    type: Date,
    required: true
  },
  // Hora de inicio del paseo (Horpas)
  walkingStartTime: {
    type: String, // Formato HH:MM
    required: true,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Walking start time must be in HH:MM format'
    }
  },
  // Tiempo del paseo en horas (Tiepas)
  walkingDuration: {
    type: Number,
    required: true,
    min: 0.5, // Mínimo 30 minutos
    max: 8 // Máximo 8 horas
  },
  // Referencia al identificador de la mascota (Masid)
  associatedPet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet', // Referencia al modelo Pet
    required: true
  },
  // Referencia al identificador del paseador (Pasid)
  associatedDogWalker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DogWalker', // Referencia al modelo DogWalker
    required: true
  },
  // Novedades presentadas en el paseo (Novpas)
  walkingNotes: {
    type: String,
    required: true,
    maxlength: 250
  },
  // Estado del paseo
  walkingStatus: {
    type: String,
    required: true,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  // Hora de finalización del paseo (calculada automáticamente)
  walkingEndTime: {
    type: String, // Formato HH:MM
    required: false
  },
  // Observaciones adicionales del administrador
  adminNotes: {
    type: String,
    required: false,
    maxlength: 500
  }
}, {
  timestamps: true // Agrega automáticamente createdAt y updatedAt
});

// Middleware para calcular automáticamente la hora de finalización
PetWalkingSchema.pre('save', function(next) {
  if (this.walkingStartTime && this.walkingDuration) {
    const [hours, minutes] = this.walkingStartTime.split(':').map(Number);
    const startTimeInMinutes = hours * 60 + minutes;
    const durationInMinutes = this.walkingDuration * 60;
    const endTimeInMinutes = startTimeInMinutes + durationInMinutes;
    
    const endHours = Math.floor(endTimeInMinutes / 60) % 24;
    const endMinutes = endTimeInMinutes % 60;
    
    this.walkingEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
  next();
});

// Índices para optimizar consultas
PetWalkingSchema.index({ walkingDate: 1 });
PetWalkingSchema.index({ associatedPet: 1 });
PetWalkingSchema.index({ associatedDogWalker: 1 });
PetWalkingSchema.index({ walkingStatus: 1 });

// Método estático para buscar paseos por fecha
PetWalkingSchema.statics.findByDate = function(date) {
  return this.find({ walkingDate: date })
    .populate('associatedPet')
    .populate('associatedDogWalker');
};

// Método estático para buscar paseos por mascota
PetWalkingSchema.statics.findByPet = function(petId) {
  return this.find({ associatedPet: petId })
    .populate('associatedDogWalker')
    .sort({ walkingDate: -1 });
};

// Método estático para buscar paseos por paseador
PetWalkingSchema.statics.findByDogWalker = function(dogWalkerId) {
  return this.find({ associatedDogWalker: dogWalkerId })
    .populate('associatedPet')
    .sort({ walkingDate: -1 });
};

export default mongoose.model('PetWalking', PetWalkingSchema);