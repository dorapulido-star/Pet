import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Table, Image, Pagination, Button, Badge } from 'react-bootstrap';
import './dogwalker.css';

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

  // Componente de paginación integrado
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

const DogWalker = () => {
  // Estados
  const [dogWalkers, setDogWalkers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Usar el custom hook para paginación
  const { currentItems: currentDogWalkers, PaginationComponent } = usePagination(dogWalkers, 3);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:5001/api/dog-walkers');
        
        const normalizedDogWalkers = Array.isArray(response.data)
          ? response.data.map((walker) => ({
              ...walker,
              createdAt: walker.createdAt ? new Date(walker.createdAt).toISOString().split('T')[0] : null,
            }))
          : [];

        setDogWalkers(normalizedDogWalkers);
        setError(null);
      } catch (error) {
        console.error('Error al obtener paseadores:', error);
        if (error.response && error.response.status === 404) {
          setError('Error: El endpoint /api/dog-walkers no está disponible. Verifica el backend.');
        } else {
          setError('Error al cargar los datos. Verifica la conexión al backend o intenta de nuevo.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este paseador?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/dog-walkers/${id}`);
      setDogWalkers(dogWalkers.filter((walker) => walker._id !== id));
      setError(null);
    } catch (error) {
      console.error('Error al eliminar el paseador:', error);
      setError('Error al eliminar el paseador. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="dog-walker-container mt-4">
      <div className="page-header mb-4">
        <h2 className="text-center page-title">
          <i className="fas fa-walking me-2"></i>
          Lista de Paseadores
        </h2>
      </div>
      
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando paseadores...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      ) : (
        <>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <Link to="/addWalker" className="btn btn-primary">
              <i className="fas fa-plus-circle me-2"></i>
              Añadir Paseador
            </Link>
            <Badge bg="secondary" className="px-3 py-2">
              Total: {dogWalkers.length} {dogWalkers.length === 1 ? 'paseador' : 'paseadores'}
            </Badge>
          </div>

          {dogWalkers.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-walking fa-3x text-muted mb-3"></i>
              <p className="text-muted">No hay paseadores registrados.</p>
              <Link to="/addWalker" className="btn btn-outline-primary">
                Registrar primer paseador
              </Link>
            </div>
          ) : (
            <div className="dog-walker-table-container">
              <Table striped bordered hover responsive className="dog-walker-table">
                <thead className="table-dark">
                  <tr>
                    <th>S. No.</th>
                    <th>Nombre</th>
                    <th>Tipo ID</th>
                    <th>Número ID</th>
                    <th>Teléfono</th>
                    <th>Correo Electrónico</th>
                    <th>Tel. Empresa</th>
                    <th>Dir. Empresa</th>
                    <th>Dir. Paseador</th>
                    <th>Foto</th>
                    <th>Tarifa/Hora</th>
                    <th>Calificación</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentDogWalkers.map((walker, index) => (
                    <tr key={walker._id}>
                      <td>{dogWalkers.indexOf(walker) + 1}</td>
                      <td className="fw-bold">{walker.nombre || 'Sin nombre'}</td>
                      <td>
                        <Badge bg="info" className="px-2 py-1">
                          {walker.tipoIdentificacion || 'N/A'}
                        </Badge>
                      </td>
                      <td>{walker.identificacion || 'Sin ID'}</td>
                      <td>
                        <div>
                          <i className="fas fa-phone me-1 text-primary"></i>
                          {walker.telefono || 'Sin teléfono'}
                        </div>
                      </td>
                      <td>
                        <div>
                          <i className="fas fa-envelope me-1 text-info"></i>
                          <span className="text-truncate" style={{ maxWidth: '150px' }} title={walker.email}>
                            {walker.email || 'Sin correo'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <i className="fas fa-building me-1 text-success"></i>
                          {walker.telefonoEmpresa || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div>
                          <i className="fas fa-map-marker-alt me-1 text-warning"></i>
                          <span className="text-truncate" style={{ maxWidth: '120px' }} title={walker.direccionEmpresa}>
                            {walker.direccionEmpresa || 'Sin dirección'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <i className="fas fa-home me-1 text-danger"></i>
                          <span className="text-truncate" style={{ maxWidth: '120px' }} title={walker.direccionPaseador}>
                            {walker.direccionPaseador || 'Sin dirección'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {walker.foto ? (
                          <Image
                            src={`http://localhost:5001/${walker.foto}`}
                            alt="Foto del Paseador"
                            thumbnail
                            style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23ddd"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3ESin foto%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <span className="text-muted">Sin foto</span>
                        )}
                      </td>
                      <td>
                        <Badge bg="success" className="px-2 py-1">
                          ${walker.tarifa || '0'}/h
                        </Badge>
                      </td>
                      <td className="text-center">
                        {walker.calificacion && walker.calificacion > 0 ? (
                          <div>
                            <div className="fw-bold text-warning">
                              {'★'.repeat(Math.max(0, Math.min(5, Math.floor(walker.calificacion))))}
                              {'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, Math.floor(walker.calificacion)))))}
                            </div>
                            <small>{walker.calificacion}/5</small>
                          </div>
                        ) : (
                          <span className="text-muted">Sin calificar</span>
                        )}
                      </td>
                      <td>
                        <small>
                          <i className="fas fa-calendar me-1 text-success"></i>
                          {walker.createdAt || 'Sin fecha'}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Link
                            to={`/EditDogWalker/${walker._id}`}
                            className="btn btn-sm btn-warning"
                            title="Editar paseador"
                          >
                            <i className="fas fa-edit me-1"></i>
                            Editar
                          </Link>
                          <Button
                            onClick={() => handleDelete(walker._id)}
                            className="btn btn-sm btn-danger"
                            title="Eliminar paseador"
                          >
                            <i className="fas fa-trash me-1"></i>
                            Eliminar
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
    </Container>
  );
};

export default DogWalker;