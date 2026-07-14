import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productsApi from '../../api/syncedProducts';
import Modal from '../../components/Modal';
import Field from '../../components/Field';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

const LIMIT = 20;

export default function ProductsTab({ shopId }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalProduct, setModalProduct] = useState(null); // null = closed, {} = create, {...} = edit
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const query = useQuery({
    queryKey: ['products', shopId, search, page],
    queryFn: () => productsApi.listProducts(shopId, { search, page, limit: LIMIT }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products', shopId] });

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id ? productsApi.updateProduct(shopId, id, data) : productsApi.createProduct(shopId, data),
    onSuccess: () => {
      invalidate();
      setModalProduct(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productsApi.deleteProduct(shopId, id),
    onSuccess: () => {
      invalidate();
      setConfirmDeleteId(null);
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search name, SKU, barcode…"
        />
        <button
          onClick={() => setModalProduct({})}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          New product
        </button>
      </div>

      {query.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {query.error && <p className="text-sm text-red-600">{query.error.message}</p>}

      {query.data && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">SKU</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Price</th>
                <th className="px-4 py-2.5">Stock</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {query.data.items.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-2.5 text-gray-600">{p.sku ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{p.category ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-700">₹{p.sellingPrice}</td>
                  <td className="px-4 py-2.5 text-gray-700">{p.stockQuantity}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {p.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs">
                    <button
                      onClick={() => setModalProduct(p)}
                      className="mr-3 text-purple-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(p.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {query.data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} limit={LIMIT} total={query.data.total} onPageChange={setPage} />
        </div>
      )}

      {modalProduct && (
        <ProductFormModal
          product={modalProduct.id ? modalProduct : null}
          onClose={() => setModalProduct(null)}
          onSubmit={(data) => saveMutation.mutate({ id: modalProduct.id, data })}
          submitting={saveMutation.isPending}
          error={saveMutation.error}
        />
      )}

      {confirmDeleteId && (
        <Modal title="Delete product?" onClose={() => setConfirmDeleteId(null)}>
          <p className="mb-4 text-sm text-gray-600">
            This only removes the cloud copy — it does not affect the shop's phone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteMutation.mutate(confirmDeleteId)}
              disabled={deleteMutation.isPending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProductFormModal({ product, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    category: product?.category ?? '',
    costPrice: product?.costPrice ?? 0,
    sellingPrice: product?.sellingPrice ?? 0,
    gstRate: product?.gstRate ?? 5,
    stockQuantity: product?.stockQuantity ?? 0,
    reorderLevel: product?.reorderLevel ?? 10,
    isActive: product?.isActive ?? true,
  });

  function handleChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      sku: form.sku || null,
      barcode: form.barcode || null,
      category: form.category || null,
      costPrice: Number(form.costPrice),
      sellingPrice: Number(form.sellingPrice),
      gstRate: Number(form.gstRate),
      stockQuantity: Number(form.stockQuantity),
      reorderLevel: Number(form.reorderLevel),
    });
  }

  return (
    <Modal title={product ? 'Edit product' : 'New product'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error.message}</div>
        )}
        <Field label="Name" value={form.name} onChange={handleChange('name')} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU" value={form.sku} onChange={handleChange('sku')} />
          <Field label="Category" value={form.category} onChange={handleChange('category')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Cost price"
            type="number"
            step="0.01"
            value={form.costPrice}
            onChange={handleChange('costPrice')}
          />
          <Field
            label="Selling price"
            type="number"
            step="0.01"
            value={form.sellingPrice}
            onChange={handleChange('sellingPrice')}
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field
            label="GST %"
            type="number"
            step="0.01"
            value={form.gstRate}
            onChange={handleChange('gstRate')}
          />
          <Field
            label="Stock qty"
            type="number"
            value={form.stockQuantity}
            onChange={handleChange('stockQuantity')}
          />
          <Field
            label="Reorder level"
            type="number"
            value={form.reorderLevel}
            onChange={handleChange('reorderLevel')}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
          />
          Active
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
        >
          {submitting ? 'Saving…' : product ? 'Save changes' : 'Create product'}
        </button>
      </form>
    </Modal>
  );
}
