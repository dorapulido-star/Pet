import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './petWalking.css';

const EditPetWalking = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    walkingDate: '',
    walkingStartTime: '',
    walkingDuration: '',
    associatedPet: '',
    associatedDogWalker: '',
    walkingNotes: '',
    walkingStatus: 'scheduled',
    adminNotes: ''
  });
  
  const [pets, setPets] = useState([]);
  const [dogWalkers, setDogWalkers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [calculatedEndTime, setCalculatedEndTime] = useState('');

  // Opciones de duración comunes
  const durationOptions = [
    { value: '0.5', label: '30 minutos' },
    { value: '1', label: '1 hora' },
    { value: '1.5', label: '1 hora 30 minutos' },
    { value: '2', label: '2 horas' },
    { value: '2.5', label: '2 horas 30 minutos' },
    { value: '3', label: '3 horas' },
    { value: '4', label: '4 horas' },
    { value: '5', label: '5 horas' },
    { value: '6', label: '6 horas' }
  ];

  // Calcular hora de finalización cuando cambian hora de inicio o duración
  useEffect(() => {
    if (formData.walkingStartTime && formData.walkingDuration) {
      calculateEndTime();
    }
  }, [formData.walkingStartTime, formData.walkingDuration]);

  const calculateEndTime = () => {
    const [hours, minutes] = formData.walkingStartTime.split(':').map(Number);
    const startTimeInMinutes = hours * 60 + minutes;
    const durationInMinutes = parseFloat(formData.walkingDuration) * 60;
    const endTimeInMinutes = startTimeInMinutes + durationInMinutes;
    
    const endHours = Math.floor(endTimeInMinutes / 60) % 24;
    const endMinutes = endTimeInMinutes % 60;
    
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    setCalculatedEndTime(endTime);
  };

  // Cargar datos del paseo y listas al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        // Cargar datos del paseo
        const walkingResponse = await axios.get(`http://localhost:5001/api/pet-walkings/${id}`);
        const walkingData = walkingResponse.data;
        
        // Formatear la fecha para el input de tipo date
        const formattedDate = walkingData.walkingDate 
          ? new Date(walkingData.walkingDate).toISOString().split('T')[0]
          : '';
        
        setFormData({
          walkingDate: formattedDate,
          walkingStartTime: walkingData.walkingStartTime || '',
          walkingDuration: walkingData.walkingDuration?.toString() || '',
          associatedPet: walkingData.associatedPet?._id || walkingData.associatedPet || '',
          associatedDogWalker: walkingData.associatedDogWalker?._id || walkingData.associatedDogWalker || '',
          walkingNotes: walkingData.walkingNotes || '',
          walkingStatus: walkingData.walkingStatus || 'scheduled',
          adminNotes: walkingData.adminNotes || ''
        });
        
        // Cargar listas de mascotas y paseadores
        const [petsResponse, dogWalkersResponse] = await Promise.all([
          axios.get('http://localhost:5001/api/pets'),
          axios.get('http://localhost:5001/api/dog-walkers')
        ]);
        
        setPets(petsResponse.data);
        setDogWalkers(dogWalkersResponse.data);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        if (error.response && error.response.status === 404) {
          setError('Paseo no encontrado');
        } else {
          setError('No se pudieron cargar los datos del paseo. Por favor, intenta nuevamente.');
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validaciones
    if (!formData.associatedPet) {
      setError('Debe seleccionar una mascota');
      setIsLoading(false);
      return;
    }

    if (!formData.associatedDogWalker) {
      setError('Debe seleccionar un paseador');
      setIsLoading(false);
      return;
    }

    if (parseFloat(formData.walkingDuration) < 0.5 || parseFloat(formData.walkingDuration) > 8) {
      setError('La duración debe estar entre 0.5 y 8 horas');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.put(`http://localhost:5001/api/pet-walkings/${id}`, formData);

      console.log('Paseo actualizado:', response.data);
      setSuccess('Paseo actualizado exitosamente!');
      
      setTimeout(() => {
        navigate('/getPetWalking');
      }, 2000);

    } catch (error) {
      console.error('Error al actualizar paseo:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || error.response.data.error || 'Error al actualizar el paseo');
      } else if (error.request) {
        setError('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en el puerto 5001');
      } else {
        setError('Error al enviar los datos. Por favor, intenta nuevamente');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Obtener fecha mínima (hoy)
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Mostrar loading mientras se cargan los datos
  if (isLoadingData) {
    return (
      <div className="pet-walking-form-wrapper">
        <Container className="py-4">
          <div className="text-center">
            <Spinner animation="border" role="status" size="lg" className="mb-3 text-primary">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
            <p className="mt-3">Cargando datos del paseo...</p>
          </div>
        </Container>
      </div>
    );
  }

  // Mostrar error si no se pudieron cargar los datos
  if (error && isLoadingData === false && !formData.walkingDate) {
    return (
      <div className="pet-walking-form-wrapper">
        <Container className="py-4">
          <Alert variant="danger" className="text-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
            <div className="mt-3">
              <Button variant="outline-secondary" onClick={() => navigate('/getPetWalking')}>
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
    <div className="pet-walking-form-wrapper">
      <Container className="py-4">
        <div className="pet-walking-form-container">
          <div className="form-header">
            <h2 className="form-title">
              <i className="fas fa-walking me-2"></i>
              Editar Paseo
            </h2>
            <p className="form-subtitle">Actualiza la información del paseo</p>
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

          <Form onSubmit={handleSubmit} className="pet-walking-form">
            {/* Información del Paseo */}
            <Card className="form-section">
              <Card.Header className="section-header walking-info-section">
                <i className="fas fa-calendar-alt me-2"></i>
                <h5 className="mb-0">Información del Paseo</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-calendar-day me-1"></i>
                        Fecha del Paseo
                      </Form.Label>
                      <Form.Control
                        type="date"
                        name="walkingDate"
                        value={formData.walkingDate}
                        onChange={handleInputChange}
                        required
                        min={getTodayDate()}
                        className="custom-input"
                      />
                      <Form.Text className="text-muted">
                        Seleccione la fecha del paseo
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-clock me-1"></i>
                        Hora de Inicio
                      </Form.Label>
                      <Form.Control
                        type="time"
                        name="walkingStartTime"
                        value={formData.walkingStartTime}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                      />
                      <Form.Text className="text-muted">
                        Formato 24 horas (HH:MM)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-hourglass-half me-1"></i>
                        Duración del Paseo
                      </Form.Label>
                      <Form.Select
                        name="walkingDuration"
                        value={formData.walkingDuration}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                      >
                        <option value="">Selecciona la duración</option>
                        {durationOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Mínimo 30 minutos, máximo 8 horas
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label">
                        <i className="fas fa-flag-checkered me-1"></i>
                        Hora de Finalización (Calculada)
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={calculatedEndTime || 'Se calculará automáticamente'}
                        disabled
                        className="custom-input calculated-field"
                      />
                      <Form.Text className="text-muted">
                        Calculada según inicio y duración
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-info-circle me-1"></i>
                        Estado del Paseo
                      </Form.Label>
                      <Form.Select
                        name="walkingStatus"
                        value={formData.walkingStatus}
                        onChange={handleInputChange}
                        required
                        className="custom-input"
                      >
                        <option value="scheduled">Programado</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completado</option>
                        <option value="cancelled">Cancelado</option>
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Actualiza el estado actual del paseo
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Selección de Mascota y Paseador */}
            <Card className="form-section">
              <Card.Header className="section-header assignment-section">
                <i className="fas fa-users me-2"></i>
                <h5 className="mb-0">Asignación</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-dog me-1"></i>
                        Seleccionar Mascota
                      </Form.Label>
                      {pets.length === 0 ? (
                        <Alert variant="warning">
                          No hay mascotas registradas.
                        </Alert>
                      ) : (
                        <Form.Select
                          name="associatedPet"
                          value={formData.associatedPet}
                          onChange={handleInputChange}
                          required
                          className="custom-input"
                        >
                          <option value="">Selecciona una mascota</option>
                          {pets.map(pet => (
                            <option key={pet._id} value={pet._id}>
                              {pet.petName} - {pet.petBreed} ({pet.petSpecies})
                            </option>
                          ))}
                        </Form.Select>
                      )}
                      <Form.Text className="text-muted">
                        Mascota asignada al paseo
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-user-tie me-1"></i>
                        Seleccionar Paseador
                      </Form.Label>
                      {dogWalkers.length === 0 ? (
                        <Alert variant="warning">
                          No hay paseadores registrados.
                        </Alert>
                      ) : (
                        <Form.Select
                          name="associatedDogWalker"
                          value={formData.associatedDogWalker}
                          onChange={handleInputChange}
                          required
                          className="custom-input"
                        >
                          <option value="">Selecciona un paseador</option>
                          {dogWalkers.map(walker => (
                            <option key={walker._id} value={walker._id}>
                              {walker.nombre} - Tel: {walker.telefono}
                            </option>
                          ))}
                        </Form.Select>
                      )}
                      <Form.Text className="text-muted">
                        Paseador responsable del paseo
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Notas y Observaciones */}
            <Card className="form-section">
              <Card.Header className="section-header notes-section">
                <i className="fas fa-clipboard me-2"></i>
                <h5 className="mb-0">Notas y Observaciones</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={12}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label required">
                        <i className="fas fa-sticky-note me-1"></i>
                        Novedades del Paseo
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="walkingNotes"
                        value={formData.walkingNotes}
                        onChange={handleInputChange}
                        required
                        maxLength={250}
                        className="custom-input"
                        placeholder="Describa las novedades o incidencias durante el paseo"
                      />
                      <Form.Text className="text-muted">
                        Máximo 250 caracteres - {250 - formData.walkingNotes.length} restantes
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <Form.Group className="custom-form-group">
                      <Form.Label className="custom-label">
                        <i className="fas fa-user-shield me-1"></i>
                        Notas del Administrador (Opcional)
                      </Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="adminNotes"
                        value={formData.adminNotes}
                        onChange={handleInputChange}
                        maxLength={500}
                        className="custom-input"
                        placeholder="Observaciones adicionales del administrador"
                      />
                      <Form.Text className="text-muted">
                        Máximo 500 caracteres - {500 - (formData.adminNotes?.length || 0)} restantes
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Información de Actualización */}
            <Card className="form-section">
              <Card.Header className="section-header">
                <i className="fas fa-info-circle me-2"></i>
                <h5 className="mb-0">Información de Actualización</h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="info" className="mb-0">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  <strong>Nota:</strong> Al actualizar este paseo, el sistema verificará que no haya conflictos de horario 
                  tanto para la mascota como para el paseador seleccionados.
                </Alert>
              </Card.Body>
            </Card>

            {/* Resumen del Paseo */}
            {formData.walkingDate && formData.walkingStartTime && calculatedEndTime && (
              <Card className="form-section summary-section">
                <Card.Header className="section-header">
                  <i className="fas fa-list-alt me-2"></i>
                  <h5 className="mb-0">Resumen del Paseo Actualizado</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={12}>
                      <div className="summary-content">
                        <p><strong>Fecha:</strong> {new Date(formData.walkingDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p><strong>Horario:</strong> {formData.walkingStartTime} - {calculatedEndTime}</p>
                        <p><strong>Duración:</strong> {durationOptions.find(d => d.value === formData.walkingDuration)?.label || formData.walkingDuration + ' horas'}</p>
                        <p><strong>Estado:</strong> <span className={`status-badge status-${formData.walkingStatus}`}>
                          {formData.walkingStatus === 'scheduled' ? 'Programado' :
                           formData.walkingStatus === 'in_progress' ? 'En Progreso' :
                           formData.walkingStatus === 'completed' ? 'Completado' : 'Cancelado'}
                        </span></p>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}

            {/* Botones de Acción */}
            <div className="form-actions">
              <Button 
                variant="outline-secondary" 
                size="lg"
                onClick={() => navigate('/getPetWalking')}
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
                disabled={isLoading || pets.length === 0 || dogWalkers.length === 0}
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
                    Actualizar Paseo
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

export default EditPetWalking;