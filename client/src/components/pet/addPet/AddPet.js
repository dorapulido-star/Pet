import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './pet.css';

const AddPet = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    petName: '',
    petSpecies: '',
    petBreed: '',
    petAge: '',
    petGender: '',
    associatedPetOwner: '',
    specialRecommendations: ''
  });
  const [petPhoto, setPetPhoto] = useState(null);
  const [petOwners, setPetOwners] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOwners, setIsLoadingOwners] = useState(true);

  // Cargar lista de propietarios al montar el componente
  useEffect(() => {
    fetchPetOwners();
  }, []);

  const fetchPetOwners = async () => {
    try {
      setIsLoadingOwners(true);
      const response = await axios.get('http://localhost:5001/api/pet-owners');
      setPetOwners(response.data);
    } catch (error) {
      console.error('Error al cargar propietarios:', error);
      setError('Error al cargar la lista de propietarios');
    } finally {
      setIsLoadingOwners(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setPetPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validación de la foto requerida
    if (!petPhoto) {
      setError('La foto de la mascota es requerida');
      setIsLoading(false);
      return;
    }

    // Validación del propietario
    if (!formData.associatedPetOwner) {
      setError('Debe seleccionar un propietario para la mascota');
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Agregar campos básicos del formulario
      formDataToSend.append('petName', formData.petName);
      formDataToSend.append('petSpecies', formData.petSpecies);
      formDataToSend.append('petBreed', formData.petBreed);
      formDataToSend.append('petAge', formData.petAge);
      formDataToSend.append('petGender', formData.petGender);
      formDataToSend.append('associatedPetOwner', formData.associatedPetOwner);
      formDataToSend.append('specialRecommendations', formData.specialRecommendations);
      
      // Agregar la foto
      formDataToSend.append('petPhoto', petPhoto);

      const response = await axios.post('http://localhost:5001/api/pets', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Mascota creada:', response.data);
      setSuccess(`Mascota ${response.data.petName || formData.petName} agregada exitosamente! ID: ${response.data.id || 'generado'}`);
      
      setTimeout(() => {
        navigate('/getPet');
      }, 2000);

    } catch (error) {
      console.error('Error al agregar mascota:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Error al agregar la mascota');
      } else if (error.request) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en el puerto 5001');
      } else {
        setError('Error al enviar los datos. Por favor, intenta nuevamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Razas de perros comunes
  const commonDogBreeds = [
    { value: 'labrador', label: 'Labrador Retriever' },
    { value: 'golden', label: 'Golden Retriever' },
    { value: 'bulldog', label: 'Bulldog' },
    { value: 'beagle', label: 'Beagle' },
    { value: 'poodle', label: 'Poodle' },
    { value: 'pastor_aleman', label: 'Pastor Alemán' },
    { value: 'yorkshire', label: 'Yorkshire Terrier' },
    { value: 'chihuahua', label: 'Chihuahua' },
    { value: 'schnauzer', label: 'Schnauzer' },
    { value: 'cocker', label: 'Cocker Spaniel' },
    { value: 'pug', label: 'Pug' },
    { value: 'husky', label: 'Husky Siberiano' },
    { value: 'pitbull', label: 'Pitbull' },
    { value: 'mestizo', label: 'Mestizo' },
    { value: 'otro', label: 'Otra raza' }
  ];

  return (
    <div className="pet-form-wrapper">
      <Container className="py-4">
        <div className="pet-form-container">
          <div className="form-header">
            <h2 className="form-title">
              <i className="fas fa-dog me-2"></i>
              Agregar Nuevo Perro
            </h2>
            <p className="form-subtitle">Complete la información del perro</p>
          </div>
          
          {error && (
            <Alert variant="danger" className="custom-alert error-alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" className="custom-alert success-alert">
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </Alert>
          )}

          <Form onSubmit={handleSubmit} className="pet-form">
            {/* Información Básica del Perro */}
            <Card className="form-section">
              <Card.Header className="section-header pet-info-section">
                <i className="fas fa-dog me-2"></i>
                <h5 className="mb-0">Información del Perro</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-tag me-1"></i>
                        Nombre del Perro
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="petName"
                        value={formData.petName}
                        onChange={handleInputChange}
                        required
                        maxLength={100}
                        className="custom-input"
                        placeholder="Ingresa el nombre del perro"
                      />
                      <Form.Text className="text-muted">
                        Máximo 100 caracteres
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-dna me-1"></i>
                        Raza
                      </Form.Label>
                      <Form.Select
                        name="petBreed"
                        value={formData.petBreed}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                      >
                        <option value="">Selecciona la raza</option>
                        {commonDogBreeds.map(breed => (
                          <option key={breed.value} value={breed.value}>
                            {breed.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Selecciona la raza del perro
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-weight me-1"></i>
                        Tamaño
                      </Form.Label>
                      <Form.Select
                        name="petSpecies"
                        value={formData.petSpecies}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                      >
                        <option value="">Selecciona el tamaño</option>
                        <option value="pequeño">Pequeño (hasta 10 kg)</option>
                        <option value="mediano">Mediano (10-25 kg)</option>
                        <option value="grande">Grande (25-40 kg)</option>
                        <option value="gigante">Gigante (más de 40 kg)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-birthday-cake me-1"></i>
                        Edad (años)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="petAge"
                        value={formData.petAge}
                        onChange={handleInputChange}
                        required
                        min="0"
                        max="25"
                        className="custom-input"
                        placeholder="0"
                      />
                      <Form.Text className="text-muted">
                        Edad del perro en años
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-venus-mars me-1"></i>
                        Género
                      </Form.Label>
                      <Form.Select
                        name="petGender"
                        value={formData.petGender}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                      >
                        <option value="">Selecciona</option>
                        <option value="male">Macho</option>
                        <option value="female">Hembra</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Información del Propietario */}
            <Card className="form-section">
              <Card.Header className="section-header owner-section">
                <i className="fas fa-user me-2"></i>
                <h5 className="mb-0">Propietario del Perro</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-user-check me-1"></i>
                        Seleccionar Propietario
                      </Form.Label>
                      {isLoadingOwners ? (
                        <div className="text-center py-3">
                          <i className="fas fa-spinner fa-spin"></i> Cargando propietarios...
                        </div>
                      ) : petOwners.length === 0 ? (
                        <Alert variant="warning">
                          No hay propietarios registrados. 
                          <Button 
                            variant="link" 
                            onClick={() => navigate('/petowner/add')}
                            className="p-0 ms-2"
                          >
                            Agregar propietario primero
                          </Button>
                        </Alert>
                      ) : (
                        <Form.Select
                          name="associatedPetOwner"
                          value={formData.associatedPetOwner}
                          onChange={handleInputChange}
                          required
                          className="custom-input"
                        >
                          <option value="">Selecciona un propietario</option>
                          {petOwners.map(owner => (
                            <option key={owner._id} value={owner._id}>
                              {owner.ownerName} - Tel: {owner.ownerPhone}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Recomendaciones Especiales */}
            <Card className="form-section">
              <Card.Header className="section-header recommendations-section">
                <i className="fas fa-notes-medical me-2"></i>
                <h5 className="mb-0">Recomendaciones Especiales</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label">
                        <i className="fas fa-clipboard-list me-1"></i>
                        Recomendaciones de Cuidado (Opcional)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="specialRecommendations"
                        value={formData.specialRecommendations}
                        onChange={handleInputChange}
                        maxLength={500}
                        className="custom-input"
                        placeholder="Ingrese alergias, medicamentos, comportamiento especial, restricciones alimenticias, etc."
                      />
                      <Form.Text className="text-muted">
                        Máximo 500 caracteres - {500 - formData.specialRecommendations.length} restantes
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Foto de la Mascota */}
            <Card className="form-section">
              <Card.Header className="section-header photo-section">
                <i className="fas fa-camera me-2"></i>
                <h5 className="mb-0">Fotografía</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-image me-1"></i>
                        Foto del Perro
                      </Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                        className="custom-file-input"
                      />
                      <Form.Text className="text-muted">
                        <span className="text-danger">* Campo requerido</span> - Formato: JPG, PNG. Tamaño máximo: 5MB
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Vista previa de la imagen */}
            {petPhoto && (
              <Card className="form-section">
                <Card.Header className="section-header preview-section">
                  <i className="fas fa-eye me-2"></i>
                  <h5 className="mb-0">Vista Previa de la Imagen</h5>
                </Card.Header>
                <Card.Body className="text-center">
                  <img 
                    src={URL.createObjectURL(petPhoto)} 
                    alt="Vista previa" 
                    className="preview-image"
                  />
                  <div className="mt-3">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={() => {
                        setPetPhoto(null);
                        document.querySelector('input[type="file"]').value = '';
                      }}
                      className="remove-image-btn"
                    >
                      <i className="fas fa-trash me-2"></i>
                      Eliminar Imagen
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}

            {/* Botones de Acción */}
            <div className="form-actions">
                <Button 
                variant="outline-secondary" 
                size="lg"
                onClick={() => navigate('/pet')}
                disabled={isLoading}
                className="action-button cancel-button"
              >
                <i className="fas fa-times me-2"></i>
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit" 
                size="lg"
                disabled={isLoading || !petPhoto || petOwners.length === 0}
                className="action-button submit-button"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Agregar Perro
                  </>
                )}
              </Button>
            </div>
          </Form>
        </div>
      </Container>
    </div>
  );
};

export default AddPet;