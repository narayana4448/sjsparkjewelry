import { useState, useEffect } from 'react'
import api from '../../utils/api'
import './Sales.css'

export default function Sales() {
  const [sales, setSales] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    customer_name: '',
    customer_phone: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api.get('/sales'),
      api.get('/products')
    ]).then(([salesRes, productsRes]) => {
      setSales(salesRes.data)
      setProducts(productsRes.data.filter(p => p.quantity > 0))
    }).finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await api.post('/sales', formData)
      setSales([res.data, ...sales])

      // Update product stock locally
      setProducts(products.map(p => {
        if (p.id == formData.product_id) {
          return { ...p, quantity: p.quantity - formData.quantity }
        }
        return p
      }).filter(p => p.quantity > 0))

      closeModal()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record sale')
    } finally {
      setSaving(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      product_id: '',
      quantity: 1,
      customer_name: '',
      customer_phone: '',
      notes: ''
    })
    setError('')
  }

  const selectedProduct = products.find(p => p.id == formData.product_id)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="sales-page">
      <div className="page-header">
        <h1>Sales</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Record Sale
        </button>
      </div>

      {sales.length === 0 ? (
        <div className="empty-state card">
          <h3>No sales recorded</h3>
          <p>Record your first sale to start tracking revenue</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Record Sale
          </button>
        </div>
      ) : (
        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.id}>
                  <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                  <td><strong>{sale.product_name}</strong></td>
                  <td>{sale.customer_name || '-'}</td>
                  <td>{sale.customer_phone || '-'}</td>
                  <td>{sale.quantity}</td>
                  <td>₹{sale.unit_price}</td>
                  <td><strong>₹{sale.total_price}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Sale</h3>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Product *</label>
                <select
                  className="form-control"
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  required
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{p.selling_price} (Stock: {p.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                  required
                  min="1"
                  max={selectedProduct?.quantity || 1}
                />
              </div>

              {selectedProduct && (
                <div className="sale-preview">
                  <strong>Total: ₹{selectedProduct.selling_price * formData.quantity}</strong>
                </div>
              )}

              <div className="form-group">
                <label>Customer Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Customer Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  className="form-control"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Recording...' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
