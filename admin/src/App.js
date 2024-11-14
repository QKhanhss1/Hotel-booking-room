import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Hotels from "./pages/hotels.jsx";

import Rooms from "./pages/rooms.jsx";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <Hotels /> },
  { path: "/room", element: <Rooms /> },
  { path: "/hotel/:id/rooms", element: <Rooms /> },
   // Thêm route cho pattern /rooms/:id
   { 
    path: "/rooms/:id", 
    element: <Rooms /> 
  },
  {
    path: "*",
    element: <div>404 Not Found</div>
  }
  
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
