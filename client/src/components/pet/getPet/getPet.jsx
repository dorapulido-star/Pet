import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Table, Image, Pagination, Button, Badge } from 'react-bootstrap';
import './getPet.css';

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

const GetPet = () => {
  // Estados
  const [pets, setPets] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Usar el custom hook para paginación
  const { currentItems: currentPets, PaginationComponent } = usePagination(pets, 3);

  // Mapeo de valores a etiquetas legibles
  const breedLabels = {
    'labrador': 'Labrador Retriever',
    'golden': 'Golden Retriever',
    'bulldog': 'Bulldog',
    'beagle': 'Beagle',
    'poodle': 'Poodle',
    'pastor_aleman': 'Pastor Alemán',
    'yorkshire': 'Yorkshire Terrier',
    'chihuahua': 'Chihuahua',
    'schnauzer': 'Schnauzer',
    'cocker': 'Cocker Spaniel',
    'pug': 'Pug',
    'husky': 'Husky Siberiano',
    'pitbull': 'Pitbull',
    'mestizo': 'Mestizo',
    'otro': 'Otra raza'
  };

  const sizeLabels = {
    'pequeño': 'Pequeño',
    'mediano': 'Mediano',
    'grande': 'Grande',
    'gigante': 'Gigante'
  };

  const genderLabels = {
    'male': 'Macho',
    'female': 'Hembra'
  };

  const fetchPets = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/pets');
      
      const normalizedPets = Array.isArray(response.data)
        ? response.data.map((pet) => ({
            ...pet,
            createdAt: pet.createdAt ? new Date(pet.createdAt).toISOString().split('T')[0] : null,
          }))
        : [];

      setPets(normalizedPets);
      setError(null);
    } catch (error) {
      console.error('Error al obtener perros:', error);
      if (error.response && error.response.status === 404) {
        setError('Error: El endpoint /api/pets no está disponible. Verifica el backend.');
      } else {
        setError('Error al cargar los datos. Verifica la conexión al backend o intenta de nuevo.');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await fetchPets();
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este perro?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.delete(`http://localhost:5001/api/pets/${id}`);
      setPets(pets.filter((pet) => pet._id !== id));
      setError(null);
    } catch (error) {
      console.error('Error al eliminar el perro:', error);
      setError('Error al eliminar el perro. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const getGenderIcon = (gender) => {
    if (gender === 'male') {
      return <i className="fas fa-mars text-primary"></i>;
    } else if (gender === 'female') {
      return <i className="fas fa-venus text-danger"></i>;
    }
    return null;
  };

  const getSizeBadgeColor = (size) => {
    switch(size) {
      case 'pequeño': return 'info';
      case 'mediano': return 'success';
      case 'grande': return 'warning';
      case 'gigante': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <Container className="pet-container mt-4">
      <div className="page-header mb-4">
        <h2 className="text-center page-title">
          <i className="fas fa-dog me-2"></i>
          Lista de Perros Registrados
        </h2>
      </div>
      
      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3">Cargando perros...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center" role="alert">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      ) : (
        <>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <Link to="/addPet" className="btn btn-primary">
              <i className="fas fa-plus-circle me-2"></i>
              Añadir Perro
            </Link>
            <Badge bg="secondary" className="px-3 py-2">
              Total: {pets.length} {pets.length === 1 ? 'perro' : 'perros'}
            </Badge>
          </div>
          
          {pets.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-dog fa-3x text-muted mb-3"></i>
              <p className="text-muted">No hay perros registrados.</p>
              <Link to="/addPet" className="btn btn-outline-primary">
                Registrar primer perro
              </Link>
            </div>
          ) : (
            <div className="pet-table-container">
              <Table striped bordered hover responsive className="pet-table">
                <thead className="table-dark">
                  <tr>
                    <th>S. No.</th>
                    <th>Nombre</th>
                    <th>Raza</th>
                    <th>Tamaño</th>
                    <th>Edad</th>
                    <th>Género</th>
                    <th>Propietario</th>
                    <th>Foto</th>
                    <th>Recomendaciones</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPets.map((pet, index) => (
                    <tr key={pet._id}>
                      <td>{pets.indexOf(pet) + 1}</td>
                      <td className="fw-bold">{pet.petName || 'Sin nombre'}</td>
                      <td>{breedLabels[pet.petBreed] || pet.petBreed || 'No especificada'}</td>
                      <td>
                        <Badge bg={getSizeBadgeColor(pet.petSpecies)}>
                          {sizeLabels[pet.petSpecies] || pet.petSpecies || 'No especificado'}
                        </Badge>
                      </td>
                      <td>{pet.petAge ? `${pet.petAge} años` : 'No especificada'}</td>
                      <td className="text-center">
                        {getGenderIcon(pet.petGender)}
                        <br />
                        <small>{genderLabels[pet.petGender] || 'No especificado'}</small>
                      </td>
                      <td>
                        {pet.associatedPetOwner ? (
                          <div>
                            <div className="fw-bold">{pet.associatedPetOwner.ownerName}</div>
                            <small className="text-muted">
                              <i className="fas fa-phone me-1"></i>
                              {pet.associatedPetOwner.ownerPhone}
                            </small>
                          </div>
                        ) : (
                          <span className="text-muted">Sin propietario</span>
                        )}
                      </td>
                      <td>
                        {pet.petPhoto ? (
                          <Image
                            src={`http://localhost:5001/${pet.petPhoto}`}
                            alt={`Foto de ${pet.petName}`}
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
                        {pet.specialRecommendations ? (
                          <div 
                            className="text-truncate" 
                            style={{ maxWidth: '200px' }}
                            title={pet.specialRecommendations}
                          >
                            <small>{pet.specialRecommendations}</small>
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <small>{pet.createdAt || 'Sin fecha'}</small>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Link
                            to={`/editPet/${pet._id}`}
                            className="btn btn-sm btn-warning"
                            title="Editar perro"
                          >
                            <i className="fas fa-edit me-1"></i>
                            Editar
                          </Link>
                          <Button
                            onClick={() => handleDelete(pet._id)}
                            className="btn btn-sm btn-danger"
                            title="Eliminar perro"
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

export default GetPet;