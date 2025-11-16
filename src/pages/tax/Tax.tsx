import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { generateId } from '../../utils/formatters';
import { Tax as TaxEntity } from '../../types/entities';
import { Edit, Trash2, Plus, X, Check } from 'lucide-react';

export const Tax: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxEntity | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    rate: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    appliesTo: 'both' as 'room' | 'invoice' | 'both',
    isActive: true,
  });

  const handleEdit = (tax: TaxEntity) => {
    setEditingTax(tax);
    setFormData({
      name: tax.name,
      rate: tax.rate,
      type: tax.type,
      appliesTo: tax.appliesTo,
      isActive: tax.isActive,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingTax(null);
    setFormData({ name: '', rate: 0, type: 'percentage', appliesTo: 'both', isActive: true });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingTax) {
      dispatch({
        type: 'UPDATE_TAX',
        payload: { ...editingTax, ...formData },
      });
    } else {
      dispatch({
        type: 'ADD_TAX',
        payload: {
          id: generateId(),
          ...formData,
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (tax: TaxEntity) => {
    if (window.confirm(`Are you sure you want to delete ${tax.name}?`)) {
      dispatch({ type: 'DELETE_TAX', payload: tax.id });
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    {
      key: 'rate',
      header: 'Rate',
      render: (tax: TaxEntity) => (tax.type === 'percentage' ? `${tax.rate}%` : `$${tax.rate}`),
    },
    { key: 'type', header: 'Type', render: (tax: TaxEntity) => tax.type.charAt(0).toUpperCase() + tax.type.slice(1) },
    {
      key: 'appliesTo',
      header: 'Applies To',
      render: (tax: TaxEntity) => tax.appliesTo.charAt(0).toUpperCase() + tax.appliesTo.slice(1),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (tax: TaxEntity) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            tax.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
          }`}
        >
          {tax.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tax: TaxEntity) => (
        <div className="flex gap-2">
          <Button aria-label="Edit tax" title="Edit tax" size="sm" variant="outline" onClick={() => handleEdit(tax)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button aria-label="Delete tax" title="Delete tax" size="sm" variant="danger" onClick={() => handleDelete(tax)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Tax Management
          </h1>
          <p className="text-slate-600 mt-1 font-medium">Configure tax rates and rules</p>
        </div>
        <Button aria-label="Add tax" title="Add tax" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.taxes} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTax ? 'Edit Tax' : 'Add Tax'}
        footer={
          <>
            <Button aria-label="Cancel" title="Cancel" variant="secondary" onClick={() => setShowModal(false)}>
              <X className="w-4 h-4" />
            </Button>
            <Button aria-label="Save" title="Save" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            type="number"
            label="Rate"
            value={formData.rate}
            onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
            step="0.01"
            min={0}
            required
          />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'percentage' | 'fixed' })}
            options={[
              { value: 'percentage', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed Amount' },
            ]}
          />
          <Select
            label="Applies To"
            value={formData.appliesTo}
            onChange={(e) => setFormData({ ...formData, appliesTo: e.target.value as 'room' | 'invoice' | 'both' })}
            options={[
              { value: 'room', label: 'Room' },
              { value: 'invoice', label: 'Invoice' },
              { value: 'both', label: 'Both' },
            ]}
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mr-2"
            />
            <label>Active</label>
          </div>
        </div>
      </Modal>
    </div>
  );
};

