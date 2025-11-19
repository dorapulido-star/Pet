import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './walker.css';

const AddWalker = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    tipoIdentificacion: '',
    identificacion: '',
    telefono: '',
    email: '',
    telefonoEmpresa: '',
    direccionEmpresa: '',
    direccionPaseador: '',
    tarifa: '',
    calificacion: ''
  });
  const [foto, setFoto] = useState(null);
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
    setFoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      
      if (foto) {
        formDataToSend.append('foto', foto);
      }

      const response = await axios.post('http://localhost:5001/api/dog-walkers', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Paseador creado:', response.data);
      setSuccess(`Paseador ${response.data.nombre || formData.nombre} agregado exitosamente! ID: ${response.data.id || 'generado'}`);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error al agregar paseador:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Error al agregar el paseador');
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
    <div className="walker-form-wrapper">
      <Container className="py-4">
        <div className="walker-form-container">
          <div className="form-header">
            <h2 className="form-title">
              <i className="fas fa-user-plus me-2"></i>
              Agregar Nuevo Paseador
            </h2>
            <p className="form-subtitle">Complete la información del paseador de mascotas</p>
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

          <Form onSubmit={handleSubmit} className="walker-form">
            {/* Información Personal */}
            <Card className="form-section mb-4">
              <Card.Header className="section-header personal-section">
                <i className="fas fa-user me-2"></i>
                <h5 className="mb-0">Información Personal</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-id-card me-1"></i>
                        Nombre Completo
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                        placeholder="Ingresa el nombre completo"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-id-badge me-1"></i>
                        Tipo de ID
                      </Form.Label>
                      <Form.Select
                        name="tipoIdentificacion"
                        value={formData.tipoIdentificacion}
                        onChange={handleInputChange}
                        required
                        className="custom-select"
                      >
                        <option value="">Selecciona</option>
                        <option value="CC">Cédula de Ciudadanía</option>
                        <option value="CE">Cédula de Extranjería</option>
                        <option value="PP">Pasaporte</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        Número de ID
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="identificacion"
                        value={formData.identificacion}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                        placeholder="Número"
                      />
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
                        Teléfono Personal
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="telefono"
                        value={formData.telefono}
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
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                        placeholder="correo@ejemplo.com"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-building me-1"></i>
                        Teléfono de la Empresa
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="telefonoEmpresa"
                        value={formData.telefonoEmpresa}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                        placeholder="+57 1 234 5678"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        Dirección Personal
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="direccionPaseador"
                        value={formData.direccionPaseador}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                        placeholder="Dirección de residencia"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Información Empresarial */}
            <Card className="form-section mb-4">
              <Card.Header className="section-header business-section">
                <i className="fas fa-briefcase me-2"></i>
                <h5 className="mb-0">Información Empresarial</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-building me-1"></i>
                        Dirección de la Empresa
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="direccionEmpresa"
                        value={formData.direccionEmpresa}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                        placeholder="Dirección completa de la empresa"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Información Profesional */}
            <Card className="form-section mb-4">
              <Card.Header className="section-header professional-section">
                <i className="fas fa-dog me-2"></i>
                <h5 className="mb-0">Información Profesional</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-dollar-sign me-1"></i>
                        Tarifa por Hora (COP)
                      </Form.Label>
                      <div className="input-group">
                        <span className="input-group-text">$</span>
                        <Form.Control
                          type="number"
                          name="tarifa"
                          value={formData.tarifa}
                          onChange={handleInputChange}
                          required
                          min="0"
                          step="1000"
                          className="custom-input"
                          placeholder="50000"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label">
                        <i className="fas fa-star me-1"></i>
                        Calificación
                      </Form.Label>
                      <Form.Select
                        name="calificacion"
                        value={formData.calificacion}
                        onChange={handleInputChange}
                        className="custom-select"
                      >
                        <option value="">Sin calificación</option>
                        <option value="1">⭐ 1 Estrella</option>
                        <option value="2">⭐⭐ 2 Estrellas</option>
                        <option value="3">⭐⭐⭐ 3 Estrellas</option>
                        <option value="4">⭐⭐⭐⭐ 4 Estrellas</option>
                        <option value="5">⭐⭐⭐⭐⭐ 5 Estrellas</option>
                        {/* <option value="6">⭐⭐⭐⭐⭐⭐ 6 Estrellas</option>
                        <option value="7">⭐⭐⭐⭐⭐⭐⭐ 7 Estrellas</option>
                        <option value="8">⭐⭐⭐⭐⭐⭐⭐⭐ 8 Estrellas</option>
                        <option value="9">⭐⭐⭐⭐⭐⭐⭐⭐⭐ 9 Estrellas</option>
                        <option value="10">⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ 10 Estrellas</option> */}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="mb-3 custom-form-group">
                      <Form.Label className="custom-label">
                        <i className="fas fa-camera me-1"></i>
                        Foto del Paseador
                      </Form.Label>
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="custom-file-input"
                      />
                      <Form.Text className="text-muted">
                        Formato: JPG, PNG. Tamaño máximo: 5MB
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Botones de Acción */}
            <div className="form-actions">
              <Button 
                variant="outline-secondary" 
                size="lg"
                onClick={() => navigate('/')}
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
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    Agregar Paseador
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

export default AddWalker;