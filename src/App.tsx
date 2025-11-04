import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Journal from '@/pages/Journal';
import Accounts from '@/pages/Accounts';
import Reports from '@/pages/Reports';
import Profile from '@/pages/Profile';

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-auto md:ml-0">
              <div className="p-4 md:p-6 pt-20 md:pt-6 bg-white min-h-full">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/journal" element={<Journal />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/profile" element={<Profile />} />
                </Routes>
              </div>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;