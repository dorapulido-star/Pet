import PetOwner from "../model/petOwnerModel.js";
import fs from 'fs';
import path from 'path';

// Función utilitaria para validación de datos del propietario de mascota
const validatePetOwnerData = async (data, file = null) => {
  const { 
    ownerName, 
    ownerPhone, 
    ownerAddress, 
    ownerEmail
  } = data;

  // Validar campos requeridos
  if (!ownerName || !ownerPhone || !ownerAddress || !ownerEmail) {
    throw new Error("Todos los campos requeridos (nombre del propietario, teléfono, dirección, email) deben estar presentes");
  }

  // Validar longitud del nombre
  if (ownerName.length > 100) {
    throw new Error("El nombre del propietario no puede exceder 100 caracteres");
  }

  // Validar longitud de la dirección
  if (ownerAddress.length > 50) {
    throw new Error("La dirección no puede exceder 50 caracteres");
  }

  // Validar longitud del email
  if (ownerEmail.length > 50) {
    throw new Error("El email no puede exceder 50 caracteres");
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(ownerEmail)) {
    throw new Error("Formato de email inválido");
  }

  // Validar teléfono (debe ser un número)
  if (isNaN(ownerPhone)) {
    throw new Error("El teléfono debe ser un número válido");
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
    ownerName: ownerName.trim(),
    ownerPhone: parseInt(ownerPhone),
    ownerAddress: ownerAddress.trim(),
    ownerEmail: ownerEmail.trim().toLowerCase(),
    ownerPhoto: file ? `uploads/${file.filename}` : null
  };
};

export const createPetOwner = async (req, res) => {
  try {
    // Verificar qué datos llegan al backend
    console.log("Body recibido:", req.body);
    console.log("Archivo recibido:", req.file);

    // Validar que se haya proporcionado una imagen
    if (!req.file) {
      throw new Error("La foto del propietario es requerida");
    }

    const petOwnerData = await validatePetOwnerData(req.body, req.file);

    const newPetOwner = new PetOwner(petOwnerData);
    const savedPetOwner = await newPetOwner.save();
    
    // Retornar respuesta con el ID y nombre para el frontend
    res.status(201).json({
      ...savedPetOwner.toObject(),
      id: savedPetOwner._id,
      ownerName: savedPetOwner.ownerName
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
    
    console.error("Error creating pet owner:", error);
    res.status(500).json({ 
      message: "Error interno al crear el propietario de mascota", 
      error: error.message 
    });
  }
};

export const getAllPetOwners = async (req, res) => {
  try {
    const petOwners = await PetOwner.find();
    if (petOwners.length === 0) {
      // Retornar array vacío en lugar de mensaje
      return res.status(200).json([]);
    }
    res.status(200).json(petOwners);
  } catch (error) {
    console.error("Error fetching pet owners:", error);
    res.status(500).json({ 
      message: "Error al obtener los propietarios de mascotas", 
      error: error.message 
    });
  }
};

export const getOnePetOwner = async (req, res) => {
  try {
    const id = req.params.id;
    const petOwner = await PetOwner.findById(id);
    if (!petOwner) {
      return res.status(404).json({ msg: "Pet owner not found" });
    }
    res.status(200).json(petOwner);
  } catch (error) {
    console.error("Error fetching pet owner:", error);
    res.status(500).json({ 
      message: "Error al obtener el propietario de mascota", 
      error: error.message 
    });
  }
};

export const updatePetOwner = async (req, res) => {
  try {
    const id = req.params.id;
    const petOwner = await PetOwner.findById(id);
    if (!petOwner) {
      return res.status(404).json({ msg: "Pet owner not found" });
    }

    console.log("Body recibido para actualización:", req.body);
    console.log("Archivo recibido para actualización:", req.file);

    // Eliminar la imagen anterior si se está subiendo una nueva
    if (req.file && petOwner.ownerPhoto) {
      const oldImagePath = path.join(process.cwd(), petOwner.ownerPhoto);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (unlinkError) {
        console.error("Error eliminando imagen anterior:", unlinkError);
      }
    }

    const updatedData = await validatePetOwnerData(req.body, req.file);
    
    // Si no se proporciona nueva imagen, mantener la anterior
    if (!req.file && petOwner.ownerPhoto) {
      updatedData.ownerPhoto = petOwner.ownerPhoto;
    }

    const updatedPetOwner = await PetOwner.findByIdAndUpdate(
      id, 
      updatedData, 
      { new: true }
    );
    
    res.status(200).json({ 
      msg: "Pet owner updated successfully", 
      data: updatedPetOwner 
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
    
    console.error("Error updating pet owner:", error);
    res.status(500).json({ 
      message: "Error al actualizar el propietario de mascota", 
      error: error.message 
    });
  }
};

export const deletePetOwner = async (req, res) => {
  try {
    const id = req.params.id;
    const petOwner = await PetOwner.findById(id);
    if (!petOwner) {
      return res.status(404).json({ msg: "Pet owner not found" });
    }

    // Eliminar la imagen asociada si existe
    if (petOwner.ownerPhoto) {
      const imagePath = path.join(process.cwd(), petOwner.ownerPhoto);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (unlinkError) {
        console.error("Error eliminando imagen:", unlinkError);
      }
    }

    await PetOwner.findByIdAndDelete(id);
    res.status(200).json({ msg: "Pet owner deleted successfully" });
  } catch (error) {
    console.error("Error deleting pet owner:", error);
    res.status(500).json({ 
      message: "Error al eliminar el propietario de mascota", 
      error: error.message 
    });
  }
};

// Función adicional para obtener la imagen de un propietario de mascota
export const getPetOwnerImage = async (req, res) => {
  try {
    const id = req.params.id;
    const petOwner = await PetOwner.findById(id);
    
    if (!petOwner) {
      return res.status(404).json({ msg: "Pet owner not found" });
    }

    if (!petOwner.ownerPhoto) {
      return res.status(404).json({ msg: "No image found for this pet owner" });
    }

    // Construir la ruta completa del archivo
    const imagePath = path.join(process.cwd(), petOwner.ownerPhoto);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ msg: "Image file not found" });
    }

    // Determinar el tipo de contenido basado en la extensión
    const ext = path.extname(petOwner.ownerPhoto).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    // Enviar el archivo
    res.set('Content-Type', contentType);
    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error fetching pet owner image:", error);
    res.status(500).json({ 
      message: "Error al obtener la imagen del propietario de mascota", 
      error: error.message 
    });
  }
};