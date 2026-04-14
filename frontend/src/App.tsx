import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LegalProvider } from "./context/LegalContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Navigation } from "./components/Navigation";
import { LandingPage } from "./components/LandingPage";
import { DocumentScanner } from "./components/DocumentScanner"; 
import { ChatbotLawyer } from "./components/ChatbotLawyer";
import { Community } from "./components/Community";
import { Profile } from "./components/Profile";
import Login from "./components/Login";
import Signup from "./components/SignUp";

// Protected Route Wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Data...</div>;
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}


function AppRoutes() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={!isLoggedIn ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!isLoggedIn ? <Signup /> : <Navigate to="/" replace />} />
        
        {/* Protected Routes */}
        <Route path="/scanner" element={
          <ProtectedRoute>
            <DocumentScanner />
          </ProtectedRoute>
        } />
        
        <Route path="/chatbot" element={
          <ProtectedRoute>
            <ChatbotLawyer />
          </ProtectedRoute>
        } />
        
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LegalProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </NotificationProvider>
      </LegalProvider>
    </AuthProvider>
  );
}