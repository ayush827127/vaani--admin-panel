import { request } from './client';

export function listShops({ page, limit, status } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);
  if (status) params.set('status', status);
  const qs = params.toString();
  return request(`/api/admin/shops${qs ? `?${qs}` : ''}`);
}

export function getShop(id) {
  return request(`/api/admin/shops/${id}`);
}

export function createShop(data) {
  return request('/api/admin/shops', { method: 'POST', body: data });
}

export function updateShop(id, data) {
  return request(`/api/admin/shops/${id}`, { method: 'PATCH', body: data });
}

export function setShopStatus(id, status) {
  return request(`/api/admin/shops/${id}/status`, { method: 'PATCH', body: { status } });
}

export function setModuleOverride(shopId, moduleId, enabled) {
  return request(`/api/admin/shops/${shopId}/modules/${moduleId}`, {
    method: 'PATCH',
    body: { enabled },
  });
}
