import { SalesFlowProvider } from './context/SalesFlowProvider';
import { AdminPage } from './pages/AdminPage';
import { SalesAssistantPage } from './pages/SalesAssistantPage';

function App() {
  if (window.location.pathname === '/admin') {
    return <AdminPage />;
  }

  return (
    <SalesFlowProvider>
      <SalesAssistantPage />
    </SalesFlowProvider>
  );
}

export default App;
