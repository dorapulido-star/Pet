import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Table, Image, Pagination, Button, Badge } from 'react-bootstrap';
import './petowner.css';

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

const PetOwner = () => {
  // Estados
  const [petOwners, setPetOwners] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Usar el custom hook para paginación
  const { currentItems: currentPetOwners, PaginationComponent } = usePagination(petOwners, 3);

  const fetchPetOwners = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/pet-owners');
      
      const normalizedPetOwners = Array.isArray(response.data)
        ? response.data.map((owner) => ({
            ...owner,
            createdAt: owner.createdAt ? new Date(owner.createdAt).toISOString().split('T')[0] : null,
          }))
        : [];

      setPetOwners(normalizedPetOwners);
      setError(null);
    } catch (error) {
      console.error('Error al obtener propietarios:', error);
      if (error.response && error.response.status === 404) {
        setError('Error: El endpoint /api/pet-owners no está disponible. Verifica el backend.');
      } else {
        setError('Error al cargar los datos. Verifica la conexión al backend o intenta de nuevo.');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchPetOwners();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este propietario?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/pet-owners/${id}`);
      setPetOwners(petOwners.filter((owner) => owner._id !== id));
      setError(null);
    } catch (error) {
      console.error('Error al eliminar el propietario:', error);
      setError('Error al eliminar el propietario. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="pet-owner-container mt-4">
      <div className="page-header mb-4">
        <h2 className="text-center page-title">
          <i className="fas fa-users me-2"></i>
          Lista de Propietarios de Mascotas
        </h2>
      </div>
      
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando propietarios...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      ) : (
        <>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <Link to="/addPetOwner" className="btn btn-primary">
              <i className="fas fa-plus-circle me-2"></i>
              Añadir Propietario
            </Link>
            <Badge bg="secondary" className="px-3 py-2">
              Total: {petOwners.length} {petOwners.length === 1 ? 'propietario' : 'propietarios'}
            </Badge>
          </div>

          {petOwners.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-users fa-3x text-muted mb-3"></i>
              <p className="text-muted">No hay propietarios registrados.</p>
              <Link to="/addPetOwner" className="btn btn-outline-primary">
                Registrar primer propietario
              </Link>
            </div>
          ) : (
            <div className="pet-owner-table-container">
              <Table striped bordered hover responsive className="pet-owner-table">
                <thead className="table-dark">
                  <tr>
                    <th>S. No.</th>
                    <th>Nombre del Propietario</th>
                    <th>Teléfono</th>
                    <th>Dirección</th>
                    <th>Correo Electrónico</th>
                    <th>Foto</th>
                    <th>Fecha Creación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPetOwners.map((owner, index) => (
                    <tr key={owner._id}>
                      <td>{petOwners.indexOf(owner) + 1}</td>
                      <td className="fw-bold">{owner.ownerName || 'Sin nombre'}</td>
                      <td>
                        <div>
                          <i className="fas fa-phone me-1 text-primary"></i>
                          {owner.ownerPhone || 'Sin teléfono'}
                        </div>
                      </td>
                      <td>
                        <div>
                          <i className="fas fa-map-marker-alt me-1 text-danger"></i>
                          {owner.ownerAddress || 'Sin dirección'}
                        </div>
                      </td>
                      <td>
                        <div>
                          <i className="fas fa-envelope me-1 text-info"></i>
                          {owner.ownerEmail || 'Sin correo'}
                        </div>
                      </td>
                      <td>
                        {owner.ownerPhoto ? (
                          <Image
                            src={`http://localhost:5001/${owner.ownerPhoto}`}
                            alt="Foto del Propietario"
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
                        <small>
                          <i className="fas fa-calendar me-1 text-success"></i>
                          {owner.createdAt || 'Sin fecha'}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Link
                            to={`/EditPetOwner/${owner._id}`}
                            className="btn btn-sm btn-warning"
                            title="Editar propietario"
                          >
                            <i className="fas fa-edit me-1"></i>
                            Editar
                          </Link>
                          <Button
                            onClick={() => handleDelete(owner._id)}
                            className="btn btn-sm btn-danger"
                            title="Eliminar propietario"
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

export default PetOwner;