import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginScreen from './components/auth/LoginScreen';
import WeekView from './components/calendar/WeekView';
import MonthView from './components/calendar/MonthView';
import RecipeList from './components/recipes/RecipeList';
import RecipeDetail from './components/recipes/RecipeDetail';
import RecipeForm from './components/recipes/RecipeForm';
import ShoppingList from './components/shopping/ShoppingList';
import CookingTracker from './components/tracker/CookingTracker';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="/calendar" element={<WeekView />} />
        <Route path="/calendar/week/:weekStart" element={<WeekView />} />
        <Route path="/calendar/month" element={<MonthView />} />
        <Route path="/calendar/month/:monthStart" element={<MonthView />} />
        <Route path="/recipes" element={<RecipeList />} />
        <Route path="/recipes/new" element={<RecipeForm />} />
        <Route path="/recipes/:id" element={<RecipeDetail />} />
        <Route path="/recipes/:id/edit" element={<RecipeForm />} />
        <Route path="/shopping" element={<ShoppingList />} />
        <Route path="/stats" element={<CookingTracker />} />
        <Route path="*" element={<Navigate to="/calendar" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
