import { useState, useEffect } from 'react'
import api from '../../utils/api'
import './Settings.css'

export default function Settings() {
  const [settings, setSettings] = useState({
    business_name: '',
    whatsapp_number: '',
    phone_number: '',
    business_address: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/settings')
      .then(res => setSettings(prev => ({ ...prev, ...res.data })))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      await api.put('/settings', settings)
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="card settings-card">
        <h2>Business Information</h2>
        <p className="settings-desc">This information is displayed to customers on your storefront.</p>

        {message && (
          <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Business Name</label>
            <input
              type="text"
              name="business_name"
              className="form-control"
              value={settings.business_name}
              onChange={handleChange}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>WhatsApp Number</label>
              <input
                type="text"
                name="whatsapp_number"
                className="form-control"
                value={settings.whatsapp_number}
                onChange={handleChange}
                placeholder="+91XXXXXXXXXX"
              />
              <small>Include country code (e.g., +91 for India)</small>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone_number"
                className="form-control"
                value={settings.phone_number}
                onChange={handleChange}
                placeholder="+91XXXXXXXXXX"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Business Address</label>
            <textarea
              name="business_address"
              className="form-control"
              value={settings.business_address}
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
