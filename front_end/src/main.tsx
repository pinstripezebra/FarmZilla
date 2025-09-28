import { ChakraProvider } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { UserProvider } from "./context/UserContex";

import HomePage from "./pages/HomePage/Home";
import LandingPage from "./pages/LandingPage/LandingPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import Login from "./pages/LoginSignupPage/Login";
import Logout from "./pages/LoginSignupPage/Logout";
import Signup from "./pages/LoginSignupPage/Signup";
import ProtectedRoute from "./pages/LoginSignupPage/ProtectedRoute";


const router = createBrowserRouter([
  {
    path: "/LandingPage",
    element: <LandingPage />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/Login",
    element: <Login />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/Logout",
    element: <Logout />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/Signup",
    element: <Signup />,
    errorElement: <NotFoundPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <UserProvider>
            <RouterProvider router={router} />
        </UserProvider>
      </ThemeProvider>
    </ChakraProvider>
  </React.StrictMode>
);