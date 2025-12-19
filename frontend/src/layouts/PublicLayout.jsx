import { Outlet, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../utils/api'
import './PublicLayout.css'

export default function PublicLayout() {
  const [settings, setSettings] = useState({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    api.get('/settings').then(res => setSettings(res.data))
  }, [])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="public-layout">
      <header className="public-header">
        <div className="header-top">
          <div className="container">
            <span className="header-tagline">Premium Imitation Jewelry Collection</span>
            <div className="header-contact">
              <a href={`tel:${settings.phone_number}`}>
                <span className="contact-icon">📞</span> {settings.phone_number}
              </a>
              <a href={`https://wa.me/${settings.whatsapp_number?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                <span className="contact-icon">💬</span> WhatsApp
              </a>
            </div>
          </div>
        </div>
        <div className="header-main">
          <div className="container">
            <Link to="/" className="logo">
              <img src="/logo.jpeg" alt="SJ Spark Jewel" className="logo-image" />
            </Link>
            <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
              <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              <Link to="/" className="nav-link" onClick={closeMobileMenu}>Home</Link>
              <a href="#collection" className="nav-link" onClick={closeMobileMenu}>Collection</a>
              <a
                href={`https://wa.me/${settings.whatsapp_number?.replace(/[^0-9]/g, '')}?text=Hi! I'd like to know more about your jewelry collection.`}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-link nav-cta"
                onClick={closeMobileMenu}
              >
                Order Now
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="public-main">
        <Outlet context={{ settings }} />
      </main>

      <footer className="public-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <img src="/logo.jpeg" alt="SJ Spark Jewel" className="footer-logo" />
              <p className="footer-tagline">Elegance in Every Piece</p>
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <Link to="/">Home</Link>
              <a href="#collection">Collection</a>
              <Link to="/admin/login">Admin</Link>
            </div>
            <div className="footer-contact">
              <h4>Contact Us</h4>
              <p>📞 {settings.phone_number}</p>
              <p>📍 {settings.business_address}</p>
              <a
                href={`https://wa.me/${settings.whatsapp_number?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-btn footer-whatsapp"
              >
                💬 Chat on WhatsApp
              </a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} SJ Spark Jewel. All rights reserved.</p>
            <p className="footer-made">Crafted with ❤️ for jewelry lovers</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
