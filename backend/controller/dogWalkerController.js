import DogWalker from "../model/dogWalkerModel.js";
import fs from 'fs';
import path from 'path';

// Función utilitaria para validación de datos de paseador
const validateDogWalkerData = async (data, file = null) => {
  const { 
    nombre, 
    tipoIdentificacion, 
    identificacion, 
    telefono, 
    email, 
    telefonoEmpresa, 
    direccionEmpresa, 
    direccionPaseador, 
    tarifa, 
    calificacion 
  } = data;

  // Validar campos requeridos
  if (!nombre || !tipoIdentificacion || !identificacion || !telefono || 
      !email || !telefonoEmpresa || !direccionEmpresa || !direccionPaseador || !tarifa) {
    throw new Error("Todos los campos requeridos (nombre, tipo de identificación, identificación, teléfono, email, teléfono empresa, dirección empresa, dirección paseador, tarifa) deben estar presentes");
  }

  // Validar tipos de identificación válidos
  const tiposValidos = ["CC", "CE", "PP"];  // Ajustado para coincidir con el frontend
  if (!tiposValidos.includes(tipoIdentificacion)) {
    throw new Error("Tipo de identificación inválido. Use CC, CE, o PP");
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Formato de email inválido");
  }

  // Validar tarifa (debe ser un número positivo)
  if (isNaN(tarifa) || parseFloat(tarifa) <= 0) {
    throw new Error("La tarifa debe ser un número positivo");
  }

  // Validar calificación si se proporciona
  if (calificacion !== undefined && calificacion !== null && calificacion !== '') {
    const cal = parseInt(calificacion);
    if (isNaN(cal) || cal < 1 || cal > 10) {
      throw new Error("La calificación debe estar entre 1 y 10");
    }
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
    nombre: nombre.trim(),
    tipoIdentificacion: tipoIdentificacion.trim(),
    identificacion: identificacion.trim(),
    telefono: telefono.trim(),
    email: email.trim().toLowerCase(),
    telefonoEmpresa: telefonoEmpresa.trim(),
    direccionEmpresa: direccionEmpresa.trim(),
    direccionPaseador: direccionPaseador.trim(),
    foto: file ? `uploads/${file.filename}` : null,  // Guardar la ruta relativa del archivo
    tarifa: parseFloat(tarifa),
    calificacion: calificacion ? parseInt(calificacion) : 1
  };
};

export const createDogWalker = async (req, res) => {
  try {
    // Verificar qué datos llegan al backend
    console.log("Body recibido:", req.body);
    console.log("Archivo recibido:", req.file);

    const dogWalkerData = await validateDogWalkerData(req.body, req.file);

    const newDogWalker = new DogWalker(dogWalkerData);
    const savedDogWalker = await newDogWalker.save();
    
    // Retornar respuesta con el ID y nombre para el frontend
    res.status(201).json({
      ...savedDogWalker.toObject(),
      id: savedDogWalker._id,
      nombre: savedDogWalker.nombre
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
    
    console.error("Error creating dog walker:", error);
    res.status(500).json({ 
      message: "Error interno al crear el paseador", 
      error: error.message 
    });
  }
};

export const getAllDogWalkers = async (req, res) => {
  try {
    const dogWalkers = await DogWalker.find();
    if (dogWalkers.length === 0) {
      // Retornar array vacío en lugar de mensaje
      return res.status(200).json([]);
    }
    res.status(200).json(dogWalkers);
  } catch (error) {
    console.error("Error fetching dog walkers:", error);
    res.status(500).json({ 
      message: "Error al obtener los paseadores", 
      error: error.message 
    });
  }
};

export const getOneDogWalker = async (req, res) => {
  try {
    const id = req.params.id;
    const dogWalker = await DogWalker.findById(id);
    if (!dogWalker) {
      return res.status(404).json({ msg: "Dog walker not found" });
    }
    res.status(200).json(dogWalker);
  } catch (error) {
    console.error("Error fetching dog walker:", error);
    res.status(500).json({ 
      message: "Error al obtener el paseador", 
      error: error.message 
    });
  }
};

export const updateDogWalker = async (req, res) => {
  try {
    const id = req.params.id;
    const dogWalker = await DogWalker.findById(id);
    if (!dogWalker) {
      return res.status(404).json({ msg: "Dog walker not found" });
    }

    console.log("Body recibido para actualización:", req.body);
    console.log("Archivo recibido para actualización:", req.file);

    // Eliminar la imagen anterior si se está subiendo una nueva
    if (req.file && dogWalker.foto) {
      const oldImagePath = path.join(process.cwd(), dogWalker.foto);
      try {
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      } catch (unlinkError) {
        console.error("Error eliminando imagen anterior:", unlinkError);
      }
    }

    const updatedData = await validateDogWalkerData(req.body, req.file);
    
    // Si no se proporciona nueva imagen, mantener la anterior
    if (!req.file && dogWalker.foto) {
      updatedData.foto = dogWalker.foto;
    }

    const updatedDogWalker = await DogWalker.findByIdAndUpdate(
      id, 
      updatedData, 
      { new: true }
    );
    
    res.status(200).json({ 
      msg: "Dog walker updated successfully", 
      data: updatedDogWalker 
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
    
    console.error("Error updating dog walker:", error);
    res.status(500).json({ 
      message: "Error al actualizar el paseador", 
      error: error.message 
    });
  }
};

export const deleteDogWalker = async (req, res) => {
  try {
    const id = req.params.id;
    const dogWalker = await DogWalker.findById(id);
    if (!dogWalker) {
      return res.status(404).json({ msg: "Dog walker not found" });
    }

    // Eliminar la imagen asociada si existe
    if (dogWalker.foto) {
      const imagePath = path.join(process.cwd(), dogWalker.foto);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (unlinkError) {
        console.error("Error eliminando imagen:", unlinkError);
      }
    }

    await DogWalker.findByIdAndDelete(id);
    res.status(200).json({ msg: "Dog walker deleted successfully" });
  } catch (error) {
    console.error("Error deleting dog walker:", error);
    res.status(500).json({ 
      message: "Error al eliminar el paseador", 
      error: error.message 
    });
  }
};

// Función adicional para obtener la imagen de un paseador
export const getDogWalkerImage = async (req, res) => {
  try {
    const id = req.params.id;
    const dogWalker = await DogWalker.findById(id);
    
    if (!dogWalker) {
      return res.status(404).json({ msg: "Dog walker not found" });
    }

    if (!dogWalker.foto) {
      return res.status(404).json({ msg: "No image found for this dog walker" });
    }

    // Construir la ruta completa del archivo
    const imagePath = path.join(process.cwd(), dogWalker.foto);
    
    // Verificar si el archivo existe
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ msg: "Image file not found" });
    }

    // Determinar el tipo de contenido basado en la extensión
    const ext = path.extname(dogWalker.foto).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    // Enviar el archivo
    res.set('Content-Type', contentType);
    res.sendFile(imagePath);
  } catch (error) {
    console.error("Error fetching dog walker image:", error);
    res.status(500).json({ 
      message: "Error al obtener la imagen del paseador", 
      error: error.message 
    });
  }
};