import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Table, Pagination, Button, Badge, Modal, Form } from 'react-bootstrap';
import './getPetWalking.css';

// Custom hook para paginación mejorado
const usePagination = (items, itemsPerPage = 3) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  // Resetear a página 1 si la página actual excede el total después de filtros
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Generar items de paginación
  let paginationItems = [];
  for (let number = 1; number <= totalPages; number++) {
    paginationItems.push(
      <Pagination.Item 
        key={number} 
        active={number === currentPage} 
        onClick={() => paginate(number)}
      >
        {number}
      </Pagination.Item>
    );
  }

  // Componente de paginación integrado (como en el primer código)
  const PaginationComponent = () => (
    <Pagination className="justify-content-center pagination-compact">
      <Pagination.First 
        onClick={() => paginate(1)} 
        disabled={currentPage === 1} 
      />
      <Pagination.Prev 
        onClick={() => paginate(currentPage - 1)} 
        disabled={currentPage === 1} 
      />
      {paginationItems}
      <Pagination.Next 
        onClick={() => paginate(currentPage + 1)} 
        disabled={currentPage === totalPages} 
      />
      <Pagination.Last 
        onClick={() => paginate(totalPages)} 
        disabled={currentPage === totalPages} 
      />
    </Pagination>
  );

  return { 
    currentItems, 
    PaginationComponent, 
    currentPage, 
    totalPages, 
    paginate 
  };
};

const GetPetWalking = () => {
  // Estados
  const [petWalkings, setPetWalkings] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedWalking, setSelectedWalking] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  
  // Usar el custom hook para paginación
  const filteredWalkings = petWalkings.filter(walking => {
    const statusMatch = filterStatus === 'all' || walking.walkingStatus === filterStatus;
    const dateMatch = !filterDate || walking.walkingDate.includes(filterDate);
    return statusMatch && dateMatch;
  });
  
  const { currentItems: currentWalkings, PaginationComponent } = usePagination(filteredWalkings, 3);

  // Mapeo de etiquetas para el estado
  const statusLabels = {
    'scheduled': 'Programado',
    'in_progress': 'En Progreso',
    'completed': 'Completado',
    'cancelled': 'Cancelado'
  };

  const fetchPetWalkings = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/pet-walkings');
      
      const normalizedWalkings = Array.isArray(response.data)
        ? response.data.map((walking) => ({
            ...walking,
            walkingDate: walking.walkingDate ? new Date(walking.walkingDate).toISOString().split('T')[0] : null,
            createdAt: walking.createdAt ? new Date(walking.createdAt).toISOString().split('T')[0] : null,
          }))
        : [];

      setPetWalkings(normalizedWalkings);
      setError(null);
    } catch (error) {
      console.error('Error al obtener paseos:', error);
      if (error.response && error.response.status === 404) {
        setError('Error: El endpoint /api/pet-walkings no está disponible. Verifica el backend.');
      } else {
        setError('Error al cargar los datos. Verifica la conexión al backend o intenta de nuevo.');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchPetWalkings();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este paseo?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/pet-walkings/${id}`);
      setPetWalkings(petWalkings.filter((walking) => walking._id !== id));
      setError(null);
    } catch (error) {
      console.error('Error al eliminar el paseo:', error);
      setError('Error al eliminar el paseo. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedWalking || !newStatus) return;
    
    try {
      await axios.patch(`http://localhost:5001/api/pet-walkings/${selectedWalking._id}/status`, {
        walkingStatus: newStatus
      });
      
      setPetWalkings(petWalkings.map(walking => 
        walking._id === selectedWalking._id 
          ? { ...walking, walkingStatus: newStatus }
          : walking
      ));
      
      setShowStatusModal(false);
      setSelectedWalking(null);
      setNewStatus('');
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      setError('Error al actualizar el estado del paseo.');
    }
  };

  const openStatusModal = (walking) => {
    setSelectedWalking(walking);
    setNewStatus(walking.walkingStatus);
    setShowStatusModal(true);
  };

  const getStatusBadgeVariant = (status) => {
    switch(status) {
      case 'scheduled': return 'primary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration);
    const minutes = (duration - hours) * 60;
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${minutes}min`;
    }
  };

  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return 'N/A';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startTimeInMinutes = hours * 60 + minutes;
    const durationInMinutes = parseFloat(duration) * 60;
    const endTimeInMinutes = startTimeInMinutes + durationInMinutes;
    
    const endHours = Math.floor(endTimeInMinutes / 60) % 24;
    const endMinutes = endTimeInMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  return (
    <Container className="pet-walking-container mt-4">
      <div className="page-header mb-4">
        <h2 className="text-center page-title">
          <i className="fas fa-walking me-2"></i>
          Lista de Paseos Programados
        </h2>
      </div>
      
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando paseos...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      ) : (
        <>
          {/* Barra de herramientas */}
          <div className="toolbar mb-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex gap-2 align-items-center">
                <Link to="/addPetWalking" className="btn btn-primary">
                  <i className="fas fa-plus-circle me-2"></i>
                  Programar Paseo
                </Link>
                <Badge bg="secondary" className="px-3 py-2">
                  Total: {petWalkings.length} {petWalkings.length === 1 ? 'paseo' : 'paseos'}
                </Badge>
              </div>
              
              {/* Filtros */}
              <div className="d-flex gap-2">
                <Form.Select 
                  size="sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="all">Todos los estados</option>
                  <option value="scheduled">Programados</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completados</option>
                  <option value="cancelled">Cancelados</option>
                </Form.Select>
                
                <Form.Control
                  type="date"
                  size="sm"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="Filtrar por fecha"
                  style={{ width: '180px' }}
                />
                
                {(filterStatus !== 'all' || filterDate) && (
                  <Button 
                    size="sm" 
                    variant="outline-secondary"
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterDate('');
                    }}
                  >
                    <i className="fas fa-times"></i> Limpiar
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {filteredWalkings.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-walking fa-3x text-muted mb-3"></i>
              <p className="text-muted">
                {petWalkings.length === 0 
                  ? 'No hay paseos programados.' 
                  : 'No hay paseos que coincidan con los filtros seleccionados.'}
              </p>
              {petWalkings.length === 0 && (
                <Link to="/addPetWalking" className="btn btn-outline-primary">
                  Programar primer paseo
                </Link>
              )}
            </div>
          ) : (
            <div className="pet-walking-table-container">
              <Table striped bordered hover responsive className="pet-walking-table">
                <thead className="table-dark">
                  <tr>
                    <th>S. No.</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Duración</th>
                    <th>Mascota</th>
                    <th>Paseador</th>
                    <th>Estado</th>
                    <th>Novedades</th>
                    <th>Notas Admin</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentWalkings.map((walking, index) => (
                    <tr key={walking._id}>
                      <td>{(filteredWalkings.indexOf(walking)) + 1}</td>
                      <td>
                        <div>
                          <i className="fas fa-calendar-alt me-1 text-primary"></i>
                          {walking.walkingDate ? new Date(walking.walkingDate + 'T00:00:00').toLocaleDateString('es-ES', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Sin fecha'}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <span>
                            <i className="fas fa-clock me-1 text-success"></i>
                            {walking.walkingStartTime || 'N/A'}
                          </span>
                          <span className="text-muted small">
                            <i className="fas fa-flag-checkered me-1"></i>
                            {calculateEndTime(walking.walkingStartTime, walking.walkingDuration)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Badge bg="info" className="px-2 py-1">
                          {formatDuration(walking.walkingDuration)}
                        </Badge>
                      </td>
                      <td>
                        {walking.associatedPet ? (
                          <div>
                            <div className="fw-bold">
                              <i className="fas fa-dog me-1"></i>
                              {walking.associatedPet.petName}
                            </div>
                            <small className="text-muted">
                              {walking.associatedPet.petBreed}
                            </small>
                          </div>
                        ) : (
                          <span className="text-muted">Sin mascota</span>
                        )}
                      </td>
                      <td>
                        {walking.associatedDogWalker ? (
                          <div>
                            <div className="fw-bold">
                              <i className="fas fa-user-tie me-1"></i>
                              {walking.associatedDogWalker.nombre}
                            </div>
                            <small className="text-muted">
                              <i className="fas fa-phone me-1"></i>
                              {walking.associatedDogWalker.telefono}
                            </small>
                          </div>
                        ) : (
                          <span className="text-muted">Sin paseador</span>
                        )}
                      </td>
                      <td className="text-center">
                        <Badge 
                          bg={getStatusBadgeVariant(walking.walkingStatus)}
                          className="status-badge"
                          style={{ cursor: 'pointer' }}
                          onClick={() => openStatusModal(walking)}
                        >
                          {statusLabels[walking.walkingStatus] || walking.walkingStatus}
                        </Badge>
                      </td>
                      <td>
                        {walking.walkingNotes ? (
                          <div 
                            className="text-truncate" 
                            style={{ maxWidth: '150px' }}
                            title={walking.walkingNotes}
                          >
                            <small>{walking.walkingNotes}</small>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {walking.adminNotes ? (
                          <div 
                            className="text-truncate" 
                            style={{ maxWidth: '150px' }}
                            title={walking.adminNotes}
                          >
                            <small>{walking.adminNotes}</small>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Button
                            size="sm"
                            variant="info"
                            onClick={() => openStatusModal(walking)}
                            title="Cambiar estado"
                          >
                            <i className="fas fa-exchange-alt"></i>
                          </Button>
                          <Link
                            to={`/editPetWalking/${walking._id}`}
                            className="btn btn-sm btn-warning"
                            title="Editar paseo"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(walking._id)}
                            title="Eliminar paseo"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <PaginationComponent />
            </div>
          )}
        </>
      )}
      
      {/* Modal para cambiar estado */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-exchange-alt me-2"></i>
            Cambiar Estado del Paseo
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWalking && (
            <>
              <p className="mb-3">
                <strong>Paseo:</strong> {selectedWalking.associatedPet?.petName || 'N/A'} - {' '}
                {selectedWalking.walkingDate ? new Date(selectedWalking.walkingDate + 'T00:00:00').toLocaleDateString('es-ES') : 'Sin fecha'}
              </p>
              <Form.Group>
                <Form.Label>Nuevo Estado:</Form.Label>
                <Form.Select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="scheduled">Programado</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleStatusUpdate}>
            Actualizar Estado
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default GetPetWalking;