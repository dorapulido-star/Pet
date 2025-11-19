import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './EditPet.css';

const EditPet = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
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
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [petOwners, setPetOwners] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingOwners, setIsLoadingOwners] = useState(true);

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

  // Cargar lista de propietarios
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

  // Cargar datos del perro al montar el componente
  useEffect(() => {
    const fetchPetData = async () => {
      setIsLoadingData(true);
      try {
        // Cargar datos del perro
        const petResponse = await axios.get(`http://localhost:5001/api/pets/${id}`);
        const petData = petResponse.data;
        
        setFormData({
          petName: petData.petName || '',
          petSpecies: petData.petSpecies || '',
          petBreed: petData.petBreed || '',
          petAge: petData.petAge || '',
          petGender: petData.petGender || '',
          associatedPetOwner: petData.associatedPetOwner?._id || petData.associatedPetOwner || '',
          specialRecommendations: petData.specialRecommendations || ''
        });
        
        // Guardar la foto actual si existe
        if (petData.petPhoto) {
          setCurrentPhotoUrl(`http://localhost:5001/${petData.petPhoto}`);
        }
        
        // Cargar lista de propietarios después
        await fetchPetOwners();
        
      } catch (error) {
        console.error('Error al cargar datos del perro:', error);
        if (error.response && error.response.status === 404) {
          setError('Perro no encontrado');
        } else {
          setError('No se pudieron cargar los datos del perro. Por favor, intenta nuevamente.');
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    if (id) {
      fetchPetData();
    }
  }, [id]);

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

    // Validación del propietario
    if (!formData.associatedPetOwner) {
      setError('Debe seleccionar un propietario para el perro');
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Agregar todos los campos del formulario
      formDataToSend.append('petName', formData.petName);
      formDataToSend.append('petSpecies', formData.petSpecies);
      formDataToSend.append('petBreed', formData.petBreed);
      formDataToSend.append('petAge', formData.petAge);
      formDataToSend.append('petGender', formData.petGender);
      formDataToSend.append('associatedPetOwner', formData.associatedPetOwner);
      formDataToSend.append('specialRecommendations', formData.specialRecommendations);
      
      // Agregar nueva foto si se seleccionó una
      if (petPhoto) {
        formDataToSend.append('petPhoto', petPhoto);
      }

      const response = await axios.put(`http://localhost:5001/api/pets/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Perro actualizado:', response.data);
      setSuccess(`Perro ${response.data.data?.petName || formData.petName} actualizado exitosamente!`);
      
      setTimeout(() => {
        navigate('/getPet');
      }, 2000);

    } catch (error) {
      console.error('Error al actualizar perro:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Error al actualizar el perro');
      } else if (error.request) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en el puerto 5001');
      } else {
        setError('Error al enviar los datos. Por favor, intenta nuevamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading mientras se cargan los datos
  if (isLoadingData) {
    return (
      <div className="pet-form-wrapper">
        <Container className="py-4">
          <div className="text-center">
            <Spinner animation="border" role="status" size="lg" className="mb-3 text-primary">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <p className="mt-3">Cargando datos del perro...</p>
          </div>
        </Container>
      </div>
    );
  }

  // Mostrar error si no se pudieron cargar los datos
  if (error && isLoadingData === false && !formData.petName) {
    return (
      <div className="pet-form-wrapper">
        <Container className="py-4">
          <Alert variant="danger" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            <div className="mt-3">
              <Button variant="outline-secondary" onClick={() => navigate('/pet')}>
                <i className="fas fa-arrow-left me-2"></i>
                Volver a la lista
              </Button>
            </div>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="pet-form-wrapper">
      <Container className="py-4">
        <div className="pet-form-container">
          <div className="form-header">
            <h2 className="form-title">
              <i className="fas fa-dog me-2"></i>
              Editar Perro
            </h2>
            <p className="form-subtitle">Actualiza la información del perro</p>
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
            <Card className="form-section mb-4">
              <Card.Header className="section-header pet-info-section">
                <i className="fas fa-dog me-2"></i>
                <h5 className="mb-0">Información del Perro</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 custom-form-group">
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
                    <Form.Group className="mb-3 custom-form-group">
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
                    <Form.Group className="mb-3 custom-form-group">
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
                    <Form.Group className="mb-3 custom-form-group">
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
                    <Form.Group className="mb-3 custom-form-group">
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
            <Card className="form-section mb-4">
              <Card.Header className="section-header owner-section">
                <i className="fas fa-user me-2"></i>
                <h5 className="mb-0">Propietario del Perro</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 custom-form-group">
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
                            onClick={() => navigate('/addPetOwner')}
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
            <Card className="form-section mb-4">
              <Card.Header className="section-header recommendations-section">
                <i className="fas fa-notes-medical me-2"></i>
                <h5 className="mb-0">Recomendaciones Especiales</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 custom-form-group">
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
                        Máximo 500 caracteres - {500 - (formData.specialRecommendations?.length || 0)} restantes
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Información de Foto */}
            <Card className="form-section mb-4">
              <Card.Header className="section-header photo-section">
                <i className="fas fa-camera me-2"></i>
                <h5 className="mb-0">Fotografía del Perro</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label">
                        <i className="fas fa-camera me-1"></i>
                        Actualizar Foto del Perro
                      </Form.Label>
                      {currentPhotoUrl && (
                        <div className="mb-2">
                          <small className="text-muted">Foto actual disponible</small>
                        </div>
                      )}
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="custom-file-input"
                      />
                      <Form.Text className="text-muted">
                        {currentPhotoUrl 
                          ? 'Selecciona una nueva imagen para reemplazar la actual. Formato: JPG, PNG. Tamaño máximo: 5MB'
                          : 'Formato: JPG, PNG. Tamaño máximo: 5MB'}
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Vista previa de la foto actual */}
                {currentPhotoUrl && !petPhoto && (
                  <Row>
                    <Col md={12}>
                      <div className="text-center">
                        <h6 className="text-muted mb-3">
                          <i className="fas fa-image me-1"></i>
                          Foto Actual
                        </h6>
                        <img 
                          src={currentPhotoUrl} 
                          alt="Foto actual del perro" 
                          className="preview-image"
                          style={{ maxWidth: '250px', maxHeight: '250px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="250" height="250"%3E%3Crect width="250" height="250" fill="%23ddd"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999"%3ESin foto%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Vista previa de la nueva foto */}
                {petPhoto && (
                  <Row>
                    <Col md={12}>
                      <div className="text-center">
                        <h6 className="text-muted mb-3">
                          <i className="fas fa-image me-1"></i>
                          Nueva Foto - Vista Previa
                        </h6>
                        <img 
                          src={URL.createObjectURL(petPhoto)} 
                          alt="Vista previa de la nueva foto" 
                          className="preview-image"
                          style={{ maxWidth: '250px', maxHeight: '250px', objectFit: 'cover' }}
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
                            Eliminar Nueva Foto
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>

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
                disabled={isLoading}
                className="action-button submit-button"
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin me-2"></i>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Actualizar Perro
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

export default EditPet;