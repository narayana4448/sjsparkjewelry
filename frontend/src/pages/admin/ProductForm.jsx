import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../../utils/api'
import './ProductForm.css'

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    original_price: '',
    selling_price: '',
    cost_price: '',
    discount_percentage: '',
    quantity: '',
    sku: '',
    status: 'available'
  })
  const [existingImages, setExistingImages] = useState([])
  const [newImages, setNewImages] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data))

    if (isEdit) {
      api.get(`/products/${id}`).then(res => {
        const p = res.data
        setFormData({
          name: p.name,
          description: p.description || '',
          category_id: p.category_id || '',
          original_price: p.original_price,
          selling_price: p.selling_price,
          cost_price: p.cost_price || '',
          discount_percentage: p.discount_percentage || '',
          quantity: p.quantity,
          sku: p.sku || '',
          status: p.status || 'available'
        })
        setExistingImages(p.images || [])
      })
    }
  }, [id, isEdit])

  const handleChange = (e) => {
    const { name, value } = e.target

    // Auto-calculate selling price when discount or original price changes
    if (name === 'discount_percentage' || name === 'original_price') {
      const originalPrice = name === 'original_price' ? parseFloat(value) : parseFloat(formData.original_price)
      const discount = name === 'discount_percentage' ? parseFloat(value) : parseFloat(formData.discount_percentage)

      if (originalPrice && discount > 0) {
        const calculatedSellingPrice = originalPrice * (1 - discount / 100)
        setFormData(prev => ({
          ...prev,
          [name]: value,
          selling_price: calculatedSellingPrice.toFixed(2)
        }))
        return
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setNewImages(prev => [...prev, ...files])
  }

  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '') data.append(key, value)
      })

      data.append('existing_images', JSON.stringify(existingImages))
      newImages.forEach(file => data.append('images', file))

      if (isEdit) {
        await api.put(`/products/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      navigate('/admin/products')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="product-form-page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Product' : 'Add Product'}</h1>
      </div>

      <div className="card form-card">
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>SKU</label>
              <input
                type="text"
                name="sku"
                className="form-control"
                value={formData.sku}
                onChange={handleChange}
                placeholder="e.g., JW-001"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="category_id"
                className="form-control"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="available">Available</option>
                <option value="sold_out">Sold Out</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>

            <div className="form-group">
              <label>Cost Price (₹) - Your buying price</label>
              <input
                type="number"
                name="cost_price"
                className="form-control"
                value={formData.cost_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="For profit calculation"
              />
            </div>

            <div className="form-group">
              <label>Original Price (₹) * - Display price</label>
              <input
                type="number"
                name="original_price"
                className="form-control"
                value={formData.original_price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Discount (%)</label>
              <input
                type="number"
                name="discount_percentage"
                className="form-control"
                value={formData.discount_percentage}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                placeholder="e.g., 10 for 10% off"
              />
            </div>

            <div className="form-group">
              <label>Selling Price (₹) * - Final price</label>
              <input
                type="number"
                name="selling_price"
                className="form-control"
                value={formData.selling_price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
              {formData.discount_percentage > 0 && (
                <small className="price-hint">Auto-calculated from {formData.discount_percentage}% discount</small>
              )}
            </div>

            <div className="form-group">
              <label>Quantity in Stock *</label>
              <input
                type="number"
                name="quantity"
                className="form-control"
                value={formData.quantity}
                onChange={handleChange}
                required
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows="4"
            ></textarea>
          </div>

          <div className="form-group">
            <label>Product Images</label>
            <div className="image-upload-area">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="file-input"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="upload-label">
                Click to upload images (max 5)
              </label>
            </div>

            {(existingImages.length > 0 || newImages.length > 0) && (
              <div className="image-preview-list">
                {existingImages.map((img, idx) => (
                  <div key={`existing-${idx}`} className="image-preview">
                    <img src={img} alt={`Product ${idx + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeExistingImage(idx)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {newImages.map((file, idx) => (
                  <div key={`new-${idx}`} className="image-preview">
                    <img src={URL.createObjectURL(file)} alt={`New ${idx + 1}`} />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeNewImage(idx)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <Link to="/admin/products" className="btn btn-outline">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
