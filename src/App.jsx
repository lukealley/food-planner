import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import ProfileSwitcher from './components/ProfileSwitcher'
import Dashboard from './pages/Dashboard'
import LogMeal from './pages/LogMeal'
import MealPlan from './pages/MealPlan'
import History from './pages/History'
import DinnerDatabase from './pages/DinnerDatabase'
import Profile from './pages/Profile'
import MealSuggestions from './pages/MealSuggestions'
import CorCard from './pages/CorCard'

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen bg-gray-50">
        <ProfileSwitcher />
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/log"         element={<LogMeal />} />
          <Route path="/plan"        element={<MealPlan />} />
          <Route path="/history"     element={<History />} />
          <Route path="/dinners"     element={<DinnerDatabase />} />
          <Route path="/profile"     element={<Profile />} />
          <Route path="/suggestions" element={<MealSuggestions />} />
          <Route path="/corcard"     element={<CorCard />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
