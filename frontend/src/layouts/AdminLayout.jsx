import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './AdminLayout.css'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src="/logo.jpeg" alt="SJ Spark Jewel" className="sidebar-logo" />
          <span className="sidebar-title">Admin Panel</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/products" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Products
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Categories
          </NavLink>
          <NavLink to="/admin/sales" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Sales
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            Settings
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <NavLink to="/" className="nav-item view-store">
            View Store
          </NavLink>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div className="header-welcome">
            Welcome, {user?.name || user?.email}
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
