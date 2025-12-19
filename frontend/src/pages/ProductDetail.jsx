import { useState, useEffect } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import api from '../utils/api'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const { settings } = useOutletContext()

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container">
        <div className="empty-state">
          <h3>Product not found</h3>
          <p>The product you're looking for doesn't exist.</p>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    )
  }

  const whatsappMessage = encodeURIComponent(
    `Hi! I'm interested in: ${product.name} (₹${product.selling_price})`
  )
  const whatsappUrl = `https://wa.me/${settings?.whatsapp_number?.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`

  return (
    <div className="product-detail container">
      <Link to="/" className="back-link">&larr; Back to Collection</Link>

      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="main-image">
            {product.images && product.images.length > 0 ? (
              <img src={product.images[selectedImage]} alt={product.name} />
            ) : (
              <div className="no-image">No Image</div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-list">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-details">
          <div className="product-header">
            {product.category_name && (
              <span className="category-tag">{product.category_name}</span>
            )}
            <h1>{product.name}</h1>
            {product.sku && <span className="sku">SKU: {product.sku}</span>}
          </div>

          <div className="price-section">
            <span className="current-price">₹{product.selling_price}</span>
            {product.original_price > product.selling_price && (
              <>
                <span className="old-price">₹{product.original_price}</span>
                <span className="discount">
                  {product.discount_percentage > 0
                    ? `${product.discount_percentage}% OFF`
                    : `${Math.round((1 - product.selling_price / product.original_price) * 100)}% OFF`
                  }
                </span>
              </>
            )}
          </div>

          <div className="availability">
            {product.quantity > 0 ? (
              <span className="in-stock">
                In Stock ({product.quantity} available)
              </span>
            ) : (
              <span className="out-of-stock">Out of Stock</span>
            )}
          </div>

          {product.description && (
            <div className="description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
          )}

          <div className="action-buttons">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-btn">
              Order on WhatsApp
            </a>
            <a href={`tel:${settings?.phone_number}`} className="btn btn-outline">
              Call Us
            </a>
          </div>

          <div className="store-info">
            <h4>Contact Information</h4>
            <p>Phone: {settings?.phone_number}</p>
            <p>Address: {settings?.business_address}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
