import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Attendees from "./pages/Attendees";
import Exchanges from "./pages/Exchanges";
import Refunds from "./pages/Refunds";
import EmailMarketing from "./pages/EmailMarketing";
import Settings from "./pages/Settings";
import Academy from "./pages/Academy";
import CourseStudents from "./pages/CourseStudents";
import Users from "./pages/Users";
import DatabaseValidation from "./pages/DatabaseValidationNew";
import TicketExchange from "./pages/TicketExchange";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/canje" element={<TicketExchange />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/attendees" element={<ProtectedRoute><Attendees /></ProtectedRoute>} />
          <Route path="/exchanges" element={<ProtectedRoute><Exchanges /></ProtectedRoute>} />
          <Route path="/refunds" element={<ProtectedRoute><Refunds /></ProtectedRoute>} />
          <Route path="/email" element={<ProtectedRoute><EmailMarketing /></ProtectedRoute>} />
          <Route path="/academy" element={<ProtectedRoute><Academy /></ProtectedRoute>} />
          <Route path="/academy/students" element={<ProtectedRoute><CourseStudents /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/database-validation" element={<ProtectedRoute><DatabaseValidation /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
