import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import './Products.css'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = () => {
    api.get('/products')
      .then(res => setProducts(res.data))
      .finally(() => setLoading(false))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/products/${id}`)
      setProducts(products.filter(p => p.id !== id))
    } catch (err) {
      alert('Failed to delete product')
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (product) => {
    if (product.quantity === 0) return <span className="badge badge-danger">Sold Out</span>
    if (product.quantity <= 5) return <span className="badge badge-warning">Low Stock</span>
    return <span className="badge badge-success">Available</span>
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary">Add Product</Link>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          className="form-control search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state card">
          <h3>No products found</h3>
          <p>Add your first product to get started</p>
          <Link to="/admin/products/new" className="btn btn-primary">Add Product</Link>
        </div>
      ) : (
        <div className="card table-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Original Price</th>
                <th>Selling Price</th>
                <th>Stock</th>
                <th>Sold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div className="product-thumb">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} />
                      ) : (
                        <div className="no-image-thumb">-</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                    {product.category_name && (
                      <span className="category-label">{product.category_name}</span>
                    )}
                  </td>
                  <td>{product.sku || '-'}</td>
                  <td>₹{product.original_price}</td>
                  <td>₹{product.selling_price}</td>
                  <td>{product.quantity}</td>
                  <td>{product.sold_quantity}</td>
                  <td>{getStatusBadge(product)}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/products/${product.id}/edit`} className="btn btn-sm btn-outline">
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
