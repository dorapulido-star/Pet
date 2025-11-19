import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './editPetOwner.css';

const EditPetOwner = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerAddress: '',
    ownerEmail: ''
  });
  
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Cargar datos del propietario al montar el componente
  useEffect(() => {
    const fetchOwnerData = async () => {
      setIsLoadingData(true);
      try {
        const response = await axios.get(`http://localhost:5001/api/pet-owners/${id}`);
        const ownerData = response.data;
        
        setFormData({
          ownerName: ownerData.ownerName || '',
          ownerPhone: ownerData.ownerPhone || '',
          ownerAddress: ownerData.ownerAddress || '',
          ownerEmail: ownerData.ownerEmail || ''
        });
        
        // Guardar la foto actual si existe
        if (ownerData.ownerPhoto) {
          setCurrentPhotoUrl(ownerData.ownerPhoto);
        }
        
      } catch (error) {
        console.error('Error al cargar datos del propietario:', error);
        if (error.response && error.response.status === 404) {
          setError('Propietario no encontrado');
        } else {
          setError('No se pudieron cargar los datos del propietario. Por favor, intenta nuevamente.');
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    if (id) {
      fetchOwnerData();
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
    setOwnerPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      
      // Agregar todos los campos del formulario
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      // Agregar nueva foto si se seleccionó una
      if (ownerPhoto) {
        formDataToSend.append('ownerPhoto', ownerPhoto);
      }

      const response = await axios.put(`http://localhost:5001/api/pet-owners/${id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Propietario actualizado:', response.data);
      setSuccess(`Propietario ${response.data.ownerName || formData.ownerName} actualizado exitosamente!`);
      
      setTimeout(() => {
        navigate('/petowner');
      }, 2000);

    } catch (error) {
      console.error('Error al actualizar propietario:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Error al actualizar el propietario');
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
      <div className="pet-owner-form-wrapper">
        <Container className="py-4">
          <div className="text-center">
            <Spinner animation="border" role="status" size="lg" className="mb-3">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <p className="mt-3">Cargando datos del propietario...</p>
          </div>
        </Container>
      </div>
    );
  }

  // Mostrar error si no se pudieron cargar los datos
  if (error && isLoadingData === false && !formData.ownerName) {
    return (
      <div className="pet-owner-form-wrapper">
        <Container className="py-4">
          <Alert variant="danger" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            <div className="mt-3">
              <Button variant="outline-secondary" onClick={() => navigate('/petowner')}>
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
    <div className="pet-owner-form-wrapper">
      <Container className="py-4">
        <div className="pet-owner-form-container">
          <div className="form-header">
            <h2 className="form-title">
              <i className="fas fa-user-edit me-2"></i>
              Editar Propietario de Mascota
            </h2>
            <p className="form-subtitle">Actualiza la información del propietario</p>
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

          <Form onSubmit={handleSubmit} className="pet-owner-form">
            {/* Información Personal */}
            <Card className="form-section mb-4">
              <Card.Header className="section-header personal-section">
                <i className="fas fa-user me-2"></i>
                <h5 className="mb-0">Información Personal</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-id-card me-1"></i>
                        Nombre Completo del Propietario
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        required
                        maxLength={100}
                        className="custom-input"
                        placeholder="Ingresa el nombre completo del propietario"
                      />
                      <Form.Text className="text-muted">
                        Máximo 100 caracteres
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Información de Contacto */}
            <Card className="form-section mb-4">
              <Card.Header className="section-header contact-section">
                <i className="fas fa-phone me-2"></i>
                <h5 className="mb-0">Información de Contacto</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-mobile-alt me-1"></i>
                        Teléfono
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="ownerPhone"
                        value={formData.ownerPhone}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                        placeholder="+57 300 123 4567"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-envelope me-1"></i>
                        Correo Electrónico
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="ownerEmail"
                        value={formData.ownerEmail}
                        onChange={handleInputChange}
                        required
                        maxLength={50}
                        className="custom-input"
                        placeholder="correo@ejemplo.com"
                      />
                      <Form.Text className="text-muted">
                        Máximo 50 caracteres
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        Dirección
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="ownerAddress"
                        value={formData.ownerAddress}
                        onChange={handleInputChange}
                        required
                        maxLength={50}
                        className="custom-input"
                        placeholder="Dirección de residencia del propietario"
                      />
                      <Form.Text className="text-muted">
                        Máximo 50 caracteres
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
                <h5 className="mb-0">Foto del Propietario</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label">
                        <i className="fas fa-camera me-1"></i>
                        Actualizar Foto del Propietario
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
                {currentPhotoUrl && !ownerPhoto && (
                  <Row>
                    <Col md={12}>
                      <div className="text-center">
                        <h6 className="text-muted mb-3">
                          <i className="fas fa-image me-1"></i>
                          Foto Actual
                        </h6>
                        <img 
                          src={currentPhotoUrl} 
                          alt="Foto actual del propietario" 
                          className="preview-image"
                          style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                        />
                        <div className="mt-3">
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => setCurrentPhotoUrl('')}
                            className="remove-image-btn"
                          >
                            <i className="fas fa-trash me-2"></i>
                            Eliminar Foto Actual
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Vista previa de la nueva foto */}
                {ownerPhoto && (
                  <Row>
                    <Col md={12}>
                      <div className="text-center">
                        <h6 className="text-muted mb-3">
                          <i className="fas fa-image me-1"></i>
                          Nueva Foto - Vista Previa
                        </h6>
                        <img 
                          src={URL.createObjectURL(ownerPhoto)} 
                          alt="Vista previa de la nueva foto" 
                          className="preview-image"
                          style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                        />
                        <div className="mt-3">
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => {
                              setOwnerPhoto(null);
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
                onClick={() => navigate('/petowner')}
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
                    Actualizar Propietario
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

export default EditPetOwner;