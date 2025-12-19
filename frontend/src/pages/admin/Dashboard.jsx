import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import './Dashboard.css'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/stats')
      .then(res => setStats(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/admin/products/new" className="btn btn-primary">Add Product</Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon products">P</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalProducts || 0}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stock">S</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalStock || 0}</span>
            <span className="stat-label">In Stock</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sold">$</div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalSold || 0}</span>
            <span className="stat-label">Items Sold</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon revenue">R</div>
          <div className="stat-info">
            <span className="stat-value">₹{stats?.totalRevenue?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon profit">₹</div>
          <div className="stat-info">
            <span className="stat-value profit-value">₹{stats?.totalProfit?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Profit</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon cost">C</div>
          <div className="stat-info">
            <span className="stat-value">₹{stats?.totalCost?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Cost</span>
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div className="card today-sales">
          <h3>Today's Revenue</h3>
          <div className="today-amount">₹{stats?.todayRevenue?.toLocaleString() || 0}</div>
          <div className="today-profit">Profit: ₹{stats?.todayProfit?.toLocaleString() || 0}</div>
        </div>

        <div className="card low-stock">
          <h3>Low Stock Alert</h3>
          <div className="low-stock-count">{stats?.lowStockCount || 0} items</div>
          <p>Products with 5 or fewer items in stock</p>
        </div>
      </div>

      <div className="card recent-sales">
        <div className="card-header">
          <h3>Recent Sales</h3>
          <Link to="/admin/sales" className="view-all">View All</Link>
        </div>
        {stats?.recentSales?.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSales.map(sale => (
                <tr key={sale.id}>
                  <td>{sale.product_name}</td>
                  <td>{sale.customer_name || '-'}</td>
                  <td>{sale.quantity}</td>
                  <td>₹{sale.total_price}</td>
                  <td>{new Date(sale.sale_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="no-sales">No sales recorded yet</p>
        )}
      </div>
    </div>
  )
}
