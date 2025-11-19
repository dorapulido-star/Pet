// ============ dogWalkerModel.js ============
import mongoose from "mongoose";

const dogWalkerSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  tipoIdentificacion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3,
    default: 'CC'
  },
  identificacion: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 20
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  telefonoEmpresa: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  direccionEmpresa: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  direccionPaseador: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  foto: {
    type: String,  // Guardamos la ruta del archivo
    required: false
  },
  tarifa: {
    type: Number,
    required: true
  },
  calificacion: {
    type: Number,
    required: false,  // Cambiado a false porque es opcional
    min: 1,
    max: 10,
    default: 1
  }
}, {
  timestamps: true
});

export default mongoose.model('DogWalker', dogWalkerSchema);