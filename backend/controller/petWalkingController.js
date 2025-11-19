import PetWalking from "../model/petWalkingModel.js";
import Pet from "../model/petModel.js";
import DogWalker from "../model/dogWalkerModel.js";

// Función auxiliar para verificar superposición de horarios
const isTimeOverlap = (start1, end1, start2, end2) => {
  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  return start1Min < end2Min && end1Min > start2Min;
};

// Función para verificar disponibilidad del PASEADOR
const checkWalkerAvailability = async (walkerId, date, startTime, duration, excludeWalkingId = null) => {
  // Calcular hora de finalización
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = startTimeInMinutes + (duration * 60);
  
  const endHour = Math.floor(endTimeInMinutes / 60) % 24;
  const endMinute = endTimeInMinutes % 60;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

  // Buscar paseos existentes del paseador en la misma fecha
  const query = {
    associatedDogWalker: walkerId,
    walkingDate: date,
    walkingStatus: { $in: ['scheduled', 'in_progress'] }
  };

  if (excludeWalkingId) {
    query._id = { $ne: excludeWalkingId };
  }

  const existingWalks = await PetWalking.find(query);

  // Verificar conflictos de horario
  for (const walk of existingWalks) {
    const existingStart = walk.walkingStartTime;
    const existingEnd = walk.walkingEndTime;

    if (isTimeOverlap(startTime, endTime, existingStart, existingEnd)) {
      throw new Error(`El paseador ya tiene un paseo programado que se superpone con este horario (${existingStart} - ${existingEnd})`);
    }
  }
};

// NUEVA FUNCIÓN: Verificar disponibilidad de la MASCOTA
const checkPetAvailability = async (petId, date, startTime, duration, excludeWalkingId = null) => {
  // Calcular hora de finalización
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = startTimeInMinutes + (duration * 60);
  
  const endHour = Math.floor(endTimeInMinutes / 60) % 24;
  const endMinute = endTimeInMinutes % 60;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

  // Buscar paseos existentes de la MASCOTA en la misma fecha
  const query = {
    associatedPet: petId,
    walkingDate: date,
    walkingStatus: { $in: ['scheduled', 'in_progress'] }
  };

  if (excludeWalkingId) {
    query._id = { $ne: excludeWalkingId };
  }

  const existingWalks = await PetWalking.find(query);

  // Verificar conflictos de horario
  for (const walk of existingWalks) {
    const existingStart = walk.walkingStartTime;
    const existingEnd = walk.walkingEndTime;

    if (isTimeOverlap(startTime, endTime, existingStart, existingEnd)) {
      // Obtener información del paseador del paseo existente para dar más contexto
      const existingWalkWithInfo = await PetWalking.findById(walk._id).populate('associatedDogWalker');
      const walkerName = existingWalkWithInfo.associatedDogWalker?.nombre || 'Paseador';
      throw new Error(`La mascota ya tiene un paseo programado con ${walkerName} que se superpone con este horario (${existingStart} - ${existingEnd})`);
    }
  }
};

// Función utilitaria para validación de datos del paseo (ACTUALIZADA)
const validatePetWalkingData = async (data, excludeWalkingId = null) => {
  const { 
    walkingDate,
    walkingStartTime,
    walkingDuration,
    associatedPet,
    associatedDogWalker,
    walkingNotes,
    walkingStatus,
    adminNotes
  } = data;

  // Validar campos requeridos
  if (!walkingDate || !walkingStartTime || !walkingDuration || !associatedPet || !associatedDogWalker || !walkingNotes) {
    throw new Error("Todos los campos requeridos (fecha, hora inicio, duración, mascota, paseador, novedades) deben estar presentes");
  }

  // Validar formato de fecha
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(walkingDate)) {
    throw new Error("La fecha debe tener el formato AAAA-MM-DD");
  }

  // Validar que la fecha no sea anterior a hoy
  const today = new Date();
  const walkDate = new Date(walkingDate);
  today.setHours(0, 0, 0, 0);
  walkDate.setHours(0, 0, 0, 0);
  
  if (walkDate < today) {
    throw new Error("No se pueden programar paseos en fechas anteriores a hoy");
  }

  // Validar formato de hora (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(walkingStartTime)) {
    throw new Error("La hora de inicio debe tener el formato HH:MM (24 horas)");
  }

  // Validar duración del paseo
  const duration = parseFloat(walkingDuration);
  if (isNaN(duration) || duration < 0.5 || duration > 8) {
    throw new Error("La duración del paseo debe ser entre 0.5 y 8 horas");
  }

  // Validar que la mascota existe
  const petExists = await Pet.findById(associatedPet);
  if (!petExists) {
    throw new Error("La mascota especificada no existe");
  }

  // Validar que el paseador existe
  const dogWalkerExists = await DogWalker.findById(associatedDogWalker);
  if (!dogWalkerExists) {
    throw new Error("El paseador especificado no existe");
  }

  // Validar longitud de las novedades
  if (walkingNotes.length > 250) {
    throw new Error("Las novedades no pueden exceder 250 caracteres");
  }

  // Validar estado del paseo si se proporciona
  const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
  if (walkingStatus && !validStatuses.includes(walkingStatus)) {
    throw new Error("El estado del paseo debe ser uno de: scheduled, in_progress, completed, cancelled");
  }

  // Validar notas del administrador si se proporcionan
  if (adminNotes && adminNotes.length > 500) {
    throw new Error("Las notas del administrador no pueden exceder 500 caracteres");
  }

  // IMPORTANTE: Verificar disponibilidad tanto del paseador como de la mascota
  // Verificar conflictos de horario para el paseador
  await checkWalkerAvailability(associatedDogWalker, walkingDate, walkingStartTime, duration, excludeWalkingId);
  
  // NUEVA VALIDACIÓN: Verificar conflictos de horario para la mascota
  await checkPetAvailability(associatedPet, walkingDate, walkingStartTime, duration, excludeWalkingId);

  return {
    walkingDate: walkingDate.trim(),
    walkingStartTime: walkingStartTime.trim(),
    walkingDuration: duration,
    associatedPet: associatedPet,
    associatedDogWalker: associatedDogWalker,
    walkingNotes: walkingNotes.trim(),
    walkingStatus: walkingStatus || 'scheduled',
    adminNotes: adminNotes ? adminNotes.trim() : ''
  };
};

export const createPetWalking = async (req, res) => {
  try {
    // Verificar qué datos llegan al backend
    console.log("Body recibido:", req.body);

    // No se pasa excludeWalkingId porque es una creación nueva
    const walkingData = await validatePetWalkingData(req.body);

    const newPetWalking = new PetWalking(walkingData);
    const savedPetWalking = await newPetWalking.save();
    
    // Poblar la información de la mascota y el paseador
    const populatedPetWalking = await PetWalking.findById(savedPetWalking._id)
      .populate('associatedPet')
      .populate('associatedDogWalker');
    
    res.status(201).json({
      ...populatedPetWalking.toObject(),
      id: populatedPetWalking._id,
      message: "Paseo programado exitosamente"
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Datos inválidos", 
        error: error.message 
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `El ${field} ya existe`, 
        error: `Valor duplicado para ${field}` 
      });
    }
    
    console.error("Error creating pet walking:", error);
    res.status(400).json({ 
      message: error.message || "Error al crear el paseo"
    });
  }
};

export const getAllPetWalkings = async (req, res) => {
  try {
    // Poblar la información de la mascota y el paseador
    const petWalkings = await PetWalking.find()
      .populate('associatedPet')
      .populate('associatedDogWalker')
      .sort({ walkingDate: -1, walkingStartTime: -1 });
    
    if (petWalkings.length === 0) {
      return res.status(200).json([]);
    }
    
    res.status(200).json(petWalkings);
  } catch (error) {
    console.error("Error fetching pet walkings:", error);
    res.status(500).json({ 
      message: "Error al obtener los paseos", 
      error: error.message 
    });
  }
};

export const getOnePetWalking = async (req, res) => {
  try {
    const id = req.params.id;
    const petWalking = await PetWalking.findById(id)
      .populate('associatedPet')
      .populate('associatedDogWalker');
    
    if (!petWalking) {
      return res.status(404).json({ msg: "Pet walking not found" });
    }
    
    res.status(200).json(petWalking);
  } catch (error) {
    console.error("Error fetching pet walking:", error);
    res.status(500).json({ 
      message: "Error al obtener el paseo", 
      error: error.message 
    });
  }
};

// Obtener paseos por fecha
export const getPetWalkingsByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ msg: "Formato de fecha inválido. Use AAAA-MM-DD" });
    }

    const petWalkings = await PetWalking.findByDate(date);
    
    if (petWalkings.length === 0) {
      return res.status(200).json([]);
    }
    
    res.status(200).json(petWalkings);
  } catch (error) {
    console.error("Error fetching pet walkings by date:", error);
    res.status(500).json({ 
      message: "Error al obtener los paseos por fecha", 
      error: error.message 
    });
  }
};

// Obtener paseos por mascota
export const getPetWalkingsByPet = async (req, res) => {
  try {
    const petId = req.params.petId;
    
    // Verificar que la mascota existe
    const petExists = await Pet.findById(petId);
    if (!petExists) {
      return res.status(404).json({ msg: "Pet not found" });
    }

    const petWalkings = await PetWalking.findByPet(petId);
    
    if (petWalkings.length === 0) {
      return res.status(200).json([]);
    }
    
    res.status(200).json(petWalkings);
  } catch (error) {
    console.error("Error fetching pet walkings by pet:", error);
    res.status(500).json({ 
      message: "Error al obtener los paseos de la mascota", 
      error: error.message 
    });
  }
};

// Obtener paseos por paseador
export const getPetWalkingsByDogWalker = async (req, res) => {
  try {
    const dogWalkerId = req.params.dogWalkerId;
    
    // Verificar que el paseador existe
    const dogWalkerExists = await DogWalker.findById(dogWalkerId);
    if (!dogWalkerExists) {
      return res.status(404).json({ msg: "Dog walker not found" });
    }

    const petWalkings = await PetWalking.findByDogWalker(dogWalkerId);
    
    if (petWalkings.length === 0) {
      return res.status(200).json([]);
    }
    
    res.status(200).json(petWalkings);
  } catch (error) {
    console.error("Error fetching pet walkings by dog walker:", error);
    res.status(500).json({ 
      message: "Error al obtener los paseos del paseador", 
      error: error.message 
    });
  }
};

export const updatePetWalking = async (req, res) => {
  try {
    const id = req.params.id;
    const petWalking = await PetWalking.findById(id);
    if (!petWalking) {
      return res.status(404).json({ msg: "Pet walking not found" });
    }

    console.log("Body recibido para actualización:", req.body);

    // IMPORTANTE: Pasar el ID del paseo actual para excluirlo de las validaciones
    const updatedData = await validatePetWalkingData(req.body, id);

    const updatedPetWalking = await PetWalking.findByIdAndUpdate(
      id, 
      updatedData, 
      { new: true }
    ).populate('associatedPet').populate('associatedDogWalker');
    
    res.status(200).json({ 
      msg: "Pet walking updated successfully", 
      data: updatedPetWalking 
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Datos inválidos", 
        error: error.message 
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `El ${field} ya existe`, 
        error: `Valor duplicado para ${field}` 
      });
    }
    
    console.error("Error updating pet walking:", error);
    res.status(400).json({ 
      message: error.message || "Error al actualizar el paseo"
    });
  }
};

export const deletePetWalking = async (req, res) => {
  try {
    const id = req.params.id;
    const petWalking = await PetWalking.findById(id);
    if (!petWalking) {
      return res.status(404).json({ msg: "Pet walking not found" });
    }

    // Solo permitir eliminar paseos programados o cancelados
    if (petWalking.walkingStatus === 'in_progress' || petWalking.walkingStatus === 'completed') {
      return res.status(400).json({ 
        msg: "No se puede eliminar un paseo en progreso o completado" 
      });
    }

    await PetWalking.findByIdAndDelete(id);
    res.status(200).json({ msg: "Pet walking deleted successfully" });
  } catch (error) {
    console.error("Error deleting pet walking:", error);
    res.status(500).json({ 
      message: "Error al eliminar el paseo", 
      error: error.message 
    });
  }
};

// Cambiar estado del paseo
export const updatePetWalkingStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { walkingStatus } = req.body;

    const petWalking = await PetWalking.findById(id);
    if (!petWalking) {
      return res.status(404).json({ msg: "Pet walking not found" });
    }

    // Validar estado
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(walkingStatus)) {
      return res.status(400).json({ 
        msg: "Estado inválido. Debe ser: scheduled, in_progress, completed, cancelled" 
      });
    }

    // Validar transiciones de estado
    const currentStatus = petWalking.walkingStatus;
    const validTransitions = {
      'scheduled': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': ['scheduled']
    };

    if (!validTransitions[currentStatus].includes(walkingStatus)) {
      return res.status(400).json({ 
        msg: `No se puede cambiar el estado de '${currentStatus}' a '${walkingStatus}'` 
      });
    }

    const updatedPetWalking = await PetWalking.findByIdAndUpdate(
      id, 
      { walkingStatus }, 
      { new: true }
    ).populate('associatedPet').populate('associatedDogWalker');
    
    res.status(200).json({ 
      msg: "Pet walking status updated successfully", 
      data: updatedPetWalking 
    });
  } catch (error) {
    console.error("Error updating pet walking status:", error);
    res.status(500).json({ 
      message: "Error al actualizar el estado del paseo", 
      error: error.message 
    });
  }
};