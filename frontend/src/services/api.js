import axios from 'axios'

// In production (Render), VITE_API_URL points to the backend service.
// In local dev, requests go through Vite's proxy at /api.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
})

// Farmers
export const registerFarmer = (data) => api.post('/farmers/register', data)
export const loginFarmer = (data) => api.post('/farmers/login', data)
export const getFarmer = (id) => api.get(`/farmers/${id}`)
export const listFarmers = () => api.get('/farmers/')

// Buyers
export const registerBuyer = (data) => api.post('/buyers/register', data)
export const loginBuyer = (data) => api.post('/buyers/login', data)
export const getBuyer = (id) => api.get(`/buyers/${id}`)

// Products
export const listProducts = (params = {}) => api.get('/products/', { params })
export const getProduct = (id) => api.get(`/products/${id}`)
export const createProduct = (farmer_id, data) => api.post(`/products/?farmer_id=${farmer_id}`, data)
export const updateProduct = (id, farmer_id, data) => api.put(`/products/${id}?farmer_id=${farmer_id}`, data)
export const getFarmerProducts = (farmer_id) => api.get(`/products/farmer/${farmer_id}`)
export const uploadProductImage = (id, formData) => api.post(`/products/${id}/upload-image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })

// Orders
export const createOrder = (buyer_id, data) => api.post(`/orders/?buyer_id=${buyer_id}`, data)
export const getBuyerOrders = (buyer_id) => api.get(`/orders/buyer/${buyer_id}`)
export const getFarmerOrders = (farmer_id) => api.get(`/orders/farmer/${farmer_id}`)
export const updateOrderStatus = (order_id, status) => api.put(`/orders/${order_id}/status?status=${status}`)

// Transport
export const registerTransportProvider = (data) => api.post('/transport/providers/register', data)
export const listTransportProviders = () => api.get('/transport/providers')
export const createTransportRequest = (data, farmer_id = null, buyer_id = null) => {
  const params = {}
  if (farmer_id) params.farmer_id = farmer_id
  if (buyer_id) params.buyer_id = buyer_id
  return api.post('/transport/requests', data, { params })
}
export const matchTransportProvider = (request_id) => api.post(`/transport/requests/${request_id}/match`)
export const updateTransportStatus = (request_id, status) => api.put(`/transport/requests/${request_id}/status?status=${status}`)

// AI
export const getRecommendations = (buyer_id, limit = 8) => api.get(`/ai/recommendations/${buyer_id}?limit=${limit}`)
export const getSimilarProducts = (product_id) => api.get(`/ai/similar-products/${product_id}`)
export const getMarketInsights = () => api.get('/ai/market-insights')

// Payments
export const initiatePayment = (data) => api.post('/payments/initiate', data)
export const simulatePayment = (order_id) => api.post(`/payments/simulate-success/${order_id}`)

export default api
