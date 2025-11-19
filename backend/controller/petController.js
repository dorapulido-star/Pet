import Pet from "../model/petModel.js";
import PetOwner from "../model/petOwnerModel.js";
import fs from 'fs';
import path from 'path';

// Función utilitaria para validación de datos de la mascota
const validatePetData = async (data, file = null) => {
  const { 
    petName, 
    petSpecies, 
    petBreed, 
    petAge,
    petGender,
    associatedPetOwner,
    specialRecommendations
  } = data;

  // Validar campos requeridos
  if (!petName || !petSpecies || !petBreed || !petAge || !petGender || !associatedPetOwner) {
    throw new Error("Todos los campos requeridos (nombre, especie, raza, edad, género, dueño) deben estar presentes");
  }

  // Validar longitud del nombre
  if (petName.length > 100) {
    throw new Error("El nombre de la mascota no puede exceder 100 caracteres");
  }

  // Validar longitud de la especie
  if (petSpecies.length > 50) {
    throw new Error("La especie no puede exceder 50 caracteres");
  }

  // Validar longitud de la raza
  if (petBreed.length > 50) {
    throw new Error("La raza no puede exceder 50 caracteres");
  }

  // Validar edad (debe ser un número positivo)
  if (isNaN(petAge) || petAge < 0) {
    throw new Error("La edad debe ser un número válido y positivo");
  }

  // Validar género
  const validGenders = ['male', 'female'];
  if (!validGenders.includes(petGender)) {
    throw new Error("El género debe ser 'male' o 'female'");
  }

  // Validar que el dueño existe
  const ownerExists = await PetOwner.findById(associatedPetOwner);
  if (!ownerExists) {
    throw new Error("El dueño especificado no existe");
  }

  // Validar recomendaciones especiales si se proporcionan
  if (specialRecommendations && specialRecommendations.length > 500) {
    throw new Error("Las recomendaciones especiales no pueden exceder 500 caracteres");
  }

  // Validar archivo de imagen si se proporciona
  if (file) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error("Formato de imagen inválido. Solo se permiten archivos JPG, JPEG y PNG");
    }
    
    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error("El archivo de imagen es demasiado grande. Máximo 5MB");
    }
  }

  return {
    petName: petName.trim(),
    petSpecies: petSpecies.trim(),
    petBreed: petBreed.trim(),
    petAge: parseInt(petAge),
    petGender: petGender.trim(),
    associatedPetOwner: associatedPetOwner,
    specialRecommendations: specialRecommendations ? specialRecommendations.trim() : '',
    petPhoto: file ? `uploads/${file.filename}` : null
  };
};

export const createPet = async (req, res) => {
  try {
    // Verificar qué datos llegan al backend
    console.log("Body recibido:", req.body);
    console.log("Archivo recibido:", req.file);

    // Validar que se haya proporcionado una imagen
    if (!req.file) {
      throw new Error("La foto de la mascota es requerida");
    }

    const petData = await validatePetData(req.body, req.file);

    const newPet = new Pet(petData);
    const savedPet = await newPet.save();
    
    // Poblar la información del dueño
    const populatedPet = await Pet.findById(savedPet._id).populate('associatedPetOwner');
    
    // Retornar respuesta con el ID y nombre para el frontend
    res.status(201).json({
      ...populatedPet.toObject(),
      id: populatedPet._id,
      petName: populatedPet.petName
    });
  } catch (error) {
    // Si hubo un error y se subió un archivo, eliminarlo
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error eliminando archivo:", unlinkError);
      }
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({ 
        message: "Datos inválidos", 
        error: error.message 
      });
    }
    
    if (error.code === 11000) {
      // Error de duplicado en MongoDB
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({ 
        message: `El ${field} ya existe`, 
        error: `Valor duplicado para ${field}` 
      });
    }
    
    console.error("Error creating pet:", error);
    res.status(500).json({ 
      message: "Error interno al crear la mascota", 
      error: error.message 
    });
  }
};

export const getAllPets = async (req, res) => {
  try {
    // Poblar la información del dueño al obtener todas las mascotas
    const pets = await Pet.find().populate('associatedPetOwner');
    if (pets.length === 0) {
      // Retornar array vacío en lugar de mensaje
      return res.status(200).json([]);
    }
    res.status(200).json(pets);
  } catch (error) {
    console.error("Error fetching pets:", error);
    res.status(500).json({ 
      message: "Error al obtener las mascotas", 
      error: error.message 
    });
  }
};

export const getOnePet = async (req, res) => {
  try {
    const id = req.params.id;
    const pet = await Pet.findById(id).populate('associatedPetOwner');
    if (!pet) {
      return res.status(404).json({ msg: "Pet not found" });
    }
    res.status(200).json(pet);
  } catch (error) {
    console.error("Error fetching pet:", error);
    res.status(500).json({ 
      message: "Error al obtener la mascota", 
      error: error.message 
    });
  }
};

// Obtener todas las mascotas de un dueño específico
export const getPetsByOwner = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    
    // Verificar que el dueño existe
    const ownerExists = await PetOwner.findById(ownerId);
    if (!ownerExists) {
      return res.status(404).json({ msg: "Owner not found" });
    }

    const pets = await Pet.find({ associatedPetOwner: ownerId }).populate('associatedPetOwner');
    
    if (pets.length === 0) {
      return res.status(200).json([]);
    }
    
    res.status(200).json(pets);
  } catch (error) {
    console.error("Error fetching pets by owner:", error);
    res.status(500).json({ 
      message: "Error al obtener las mascotas del dueño", 
      error: error.message 
    });
  }
};

export const updatePet = async (req, res) => {
  try {
    const id = req.params.id;
    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({ msg: "Pet not found" });
    }

    console.log("Body recibido para actualización:", req.body);
    console.log("Archivo recibido para actualización:", req.file);

    // Eliminar la imagen anterior si se está subiendo una nueva
    if (req.file && pet.petPhoto) {
      const oldImagePath = path.join(process.cwd(), pet.petPhoto);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (unlinkError) {
        console.error("Error eliminando imagen anterior:", unlinkError);
      }
    }

    const updatedData = await validatePetData(req.body, req.file);
    
    // Si no se proporciona nueva imagen, mantener la anterior
    if (!req.file && pet.petPhoto) {
      updatedData.petPhoto = pet.petPhoto;
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      id, 
      updatedData, 
      { new: true }
    ).populate('associatedPetOwner');
    
    res.status(200).json({ 
      msg: "Pet updated successfully", 
      data: updatedPet 
    });
  } catch (error) {
    // Si hubo un error y se subió un archivo, eliminarlo
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Error eliminando archivo:", unlinkError);
      }
    }

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
    
    console.error("Error updating pet:", error);
    res.status(500).json({ 
      message: "Error al actualizar la mascota", 
      error: error.message 
    });
  }
};

export const deletePet = async (req, res) => {
  try {
    const id = req.params.id;
    const pet = await Pet.findById(id);
    if (!pet) {
      return res.status(404).json({ msg: "Pet not found" });
    }

    // Eliminar la imagen asociada si existe
    if (pet.petPhoto) {
      const imagePath = path.join(process.cwd(), pet.petPhoto);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (unlinkError) {
        console.error("Error eliminando imagen:", unlinkError);
      }
    }

    await Pet.findByIdAndDelete(id);
    res.status(200).json({ msg: "Pet deleted successfully" });
  } catch (error) {
    console.error("Error deleting pet:", error);
    res.status(500).json({ 
      message: "Error al eliminar la mascota", 
      error: error.message 
    });
  }
};

// Función adicional para obtener la imagen de una mascota
export const getPetImage = async (req, res) => {
  try {
    const id = req.params.id;
    const pet = await Pet.findById(id);
    
    if (!pet) {
      return res.status(404).json({ msg: "Pet not found" });
    }

    if (!pet.petPhoto) {
      return res.status(404).json({ msg: "No image found for this pet" });
    }

    // Construir la ruta completa del archivo
    const imagePath = path.join(process.cwd(), pet.petPhoto);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ msg: "Image file not found" });
    }

    // Determinar el tipo de contenido basado en la extensión
    const ext = path.extname(pet.petPhoto).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    // Enviar el archivo
    res.set('Content-Type', contentType);
    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error fetching pet image:", error);
    res.status(500).json({ 
      message: "Error al obtener la imagen de la mascota", 
      error: error.message 
    });
  }
};