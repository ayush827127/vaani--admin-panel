import { request } from './client';

function buildQuery({ search, page, limit } = {}) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function listProducts(shopId, opts) {
  return request(`/api/admin/shops/${shopId}/products${buildQuery(opts)}`);
}

export function createProduct(shopId, data) {
  return request(`/api/admin/shops/${shopId}/products`, { method: 'POST', body: data });
}

export function updateProduct(shopId, id, data) {
  return request(`/api/admin/shops/${shopId}/products/${id}`, { method: 'PATCH', body: data });
}

export function deleteProduct(shopId, id) {
  return request(`/api/admin/shops/${shopId}/products/${id}`, { method: 'DELETE' });
}
