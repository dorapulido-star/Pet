import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AddWalker from "./components/dogWalker/addwalker/addWalker.jsx";
import DogWalker from "./components/dogWalker/getdogwalker/dogWalker.jsx";
import EditDogWalker from './components/dogWalker/updatedogWalker/EditDogWalker.jsx';
import AddPetOwner from './components/petOwner/addpetowner/addPetOwner.jsx';
import PetOwner from './components/petOwner/getPetOwner/petOwner.jsx';
import EditPetOwner from './components/petOwner/updatePetOwner/EditPetOwner.jsx'; // Añadir si existe
import "./App.css";
import AddPet from './components/pet/addPet/AddPet.js';
import GetPet from './components/pet/getPet/getPet.jsx';
import EditPet from './components/pet/updatePet/EditPet.jsx';
import AddPetWalking from './components/petWalking/addPetWalking/addPetWalking.jsx';
import GetPetWalking from './components/petWalking/getPetWalking/getPetWalking.jsx';
import EditPetWalking from './components/petWalking/updatePetWalking/editPetWalking.jsx';

function App() {
  const route = createBrowserRouter([
    {
      path: "/",
      element: <DogWalker />, // Página inicial 
    },
    {
      path: "/addWalker",
      element: <AddWalker />,
    }, 
    {
      path: "/EditDogWalker/:id",
      element: <EditDogWalker />,
    },
    {
      path: "/petowner",  // ✅ Ruta corregida sin :id
      element: <PetOwner />
    },
    {
      path: "/addPetOwner",
      element: <AddPetOwner />
    },
    {
      path: "//EditPetOwner/:id",  // ✅ Añadir esta ruta para editar
      element: <EditPetOwner />  // Necesitarás crear este componente
    },
    {
      path: "/getPet",  // ✅ Ruta corregida sin :id
      element: <GetPet />
    },
    {
      path: "/addPet",  // ✅ 
      element: <AddPet />
    },
    {
      path: "/EditPet/:id",  // ✅ Añadir esta ruta para editar
      element: <EditPet />  // Necesitarás crear este componente
    },
    ,
    {
      path: "/getPetWalking",  // 
      element: <GetPetWalking />
    },
    {
      path: "/addPetWalking",  // ✅ 
      element: <AddPetWalking />
    },
    {
      path: "/EditPetWalking/:id",  // ✅ Añadir esta ruta para editar
      element: <EditPetWalking />  // Necesitarás crear este componente
    }
  ]);
  
  return (
    <div className="App">
      <RouterProvider router={route}></RouterProvider>
    </div>
  );
}

export default App;