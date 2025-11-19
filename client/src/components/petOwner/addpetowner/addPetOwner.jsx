import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './petOwner.css';

const AddPetOwner = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerAddress: '',
    ownerEmail: ''
  });
  const [ownerPhoto, setOwnerPhoto] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

    // Validación de la foto requerida
    if (!ownerPhoto) {
      setError('La foto del propietario es requerida');
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Agregar campos básicos del formulario
      formDataToSend.append('ownerName', formData.ownerName);
      formDataToSend.append('ownerPhone', formData.ownerPhone);
      formDataToSend.append('ownerAddress', formData.ownerAddress);
      formDataToSend.append('ownerEmail', formData.ownerEmail);
      
      // Agregar la foto
      formDataToSend.append('ownerPhoto', ownerPhoto);

      const response = await axios.post('http://localhost:5001/api/pet-owners', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Propietario creado:', response.data);
      setSuccess(`Propietario ${response.data.ownerName || formData.ownerName} agregado exitosamente! ID: ${response.data.id || 'generado'}`);
      
      setTimeout(() => {
        navigate('/petowner');
      }, 2000);

    } catch (error) {
      console.error('Error al agregar propietario:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Error al agregar el propietario');
      } else if (error.request) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en el puerto 5001');
      } else {
        setError('Error al enviar los datos. Por favor, intenta nuevamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pet-owner-form-wrapper">
      <Container className="py-4">
        <div className="pet-owner-form-container">
          <div className="form-header">
            <h2 className="form-title">
              <i className="fas fa-user-plus me-2"></i>
              Agregar Nuevo Propietario de Mascota
            </h2>
            <p className="form-subtitle">Complete la información del propietario</p>
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
            <Card className="form-section">
              <Card.Header className="section-header personal-section">
                <i className="fas fa-user me-2"></i>
                <h5 className="mb-0">Información Personal</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="custom-form-group">
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
            <Card className="form-section">
              <Card.Header className="section-header contact-section">
                <i className="fas fa-phone me-2"></i>
                <h5 className="mb-0">Información de Contacto</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
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
                        pattern="[0-9]*"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
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
                    <Form.Group className="custom-form-group">
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

            <Row>
              <Col md={6}>
                <Form.Group className="custom-form-group">
                  <Form.Label className="custom-label required">
                    <i className="fas fa-camera me-1"></i>
                    Foto del Propietario
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

            {/* Vista previa de la imagen */}
            {ownerPhoto && (
              <Card className="form-section">
                <Card.Header className="section-header preview-section">
                  <i className="fas fa-image me-2"></i>
                  <h5 className="mb-0">Vista Previa de la Imagen</h5>
                </Card.Header>
                <Card.Body className="text-center">
                  <img 
                    src={URL.createObjectURL(ownerPhoto)} 
                    alt="Vista previa" 
                    className="preview-image"
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
                disabled={isLoading || !ownerPhoto}
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
                    Agregar Propietario
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

export default AddPetOwner;