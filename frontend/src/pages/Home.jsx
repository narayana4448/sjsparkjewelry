import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import api from '../utils/api'
import './Home.css'

export default function Home() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const { settings } = useOutletContext()

  useEffect(() => {
    Promise.all([
      api.get('/products'),
      api.get('/categories')
    ]).then(([productsRes, categoriesRes]) => {
      setProducts(productsRes.data)
      setCategories(categoriesRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id == selectedCategory
    const matchesSearch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && product.status !== 'sold_out'
  })

  const getImageUrl = (product) => {
    if (product.images && product.images.length > 0) {
      const img = product.images[0]
      // Images are stored as /uploads/filename.jpg and served via nginx proxy
      if (img.startsWith('http')) return img
      return img
    }
    return '/placeholder.svg'
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="home-page container">
      <section className="hero" id="collection">
        <h1>Explore Our <span>Exclusive</span> Collection</h1>
        <p>Discover stunning imitation jewelry crafted with elegance for every special moment</p>
      </section>

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-control"
          />
        </div>
        <div className="category-filter">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-control"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="empty-state">
          <h3>No products found</h3>
          <p>Try adjusting your filters or check back later for new arrivals.</p>
        </div>
      ) : (
        <div className="products-grid grid grid-4">
          {filteredProducts.map(product => (
            <Link to={`/product/${product.id}`} key={product.id} className="product-card">
              <div className="product-image">
                <img src={getImageUrl(product)} alt={product.name} />
                {product.discount_percentage > 0 && (
                  <span className="discount-badge">{product.discount_percentage}% OFF</span>
                )}
                {product.quantity <= 3 && product.quantity > 0 && (
                  <span className="stock-badge">Only {product.quantity} left</span>
                )}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                {product.category_name && (
                  <span className="product-category">{product.category_name}</span>
                )}
                <div className="product-price">
                  <span className="selling-price">₹{product.selling_price}</span>
                  {product.original_price > product.selling_price && (
                    <span className="original-price">₹{product.original_price}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <section className="contact-section">
        <h2>Interested in our products?</h2>
        <p>Contact us via WhatsApp for orders and inquiries</p>
        <a
          href={`https://wa.me/${settings?.whatsapp_number?.replace(/[^0-9]/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-btn"
        >
          Chat on WhatsApp
        </a>
      </section>
    </div>
  )
}
