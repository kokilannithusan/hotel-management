import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { generateId } from '../../utils/formatters';
import { Policy } from '../../types/entities';
import { Edit, Trash2, Plus, X, Check } from 'lucide-react';

export const Policies: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    isActive: true,
  });

  const handleEdit = (policy: Policy) => {
    setEditingPolicy(policy);
    setFormData({
      title: policy.title,
      description: policy.description,
      category: policy.category,
      isActive: policy.isActive,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingPolicy(null);
    setFormData({ title: '', description: '', category: 'General', isActive: true });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingPolicy) {
      dispatch({
        type: 'UPDATE_POLICY',
        payload: { ...editingPolicy, ...formData },
      });
    } else {
      dispatch({
        type: 'ADD_POLICY',
        payload: {
          id: generateId(),
          ...formData,
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (policy: Policy) => {
    if (window.confirm(`Are you sure you want to delete ${policy.title}?`)) {
      dispatch({ type: 'DELETE_POLICY', payload: policy.id });
    }
  };

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'description', header: 'Description' },
    { key: 'category', header: 'Category' },
    {
      key: 'isActive',
      header: 'Status',
      render: (policy: Policy) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            policy.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
          }`}
        >
          {policy.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (policy: Policy) => (
        <div className="flex gap-2">
          <Button aria-label="Edit policy" title="Edit policy" size="sm" variant="outline" onClick={() => handleEdit(policy)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button aria-label="Delete policy" title="Delete policy" size="sm" variant="danger" onClick={() => handleDelete(policy)}>
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
            Policies
          </h1>
          <p className="text-slate-600 mt-1 font-medium">Manage hotel policies and rules</p>
        </div>
        <Button aria-label="Add policy" title="Add policy" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.policies} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPolicy ? 'Edit Policy' : 'Add Policy'}
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
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
          </div>
          <Select
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: 'General', label: 'General' },
              { value: 'Check-in/Check-out', label: 'Check-in/Check-out' },
              { value: 'Cancellation', label: 'Cancellation' },
              { value: 'Payment', label: 'Payment' },
              { value: 'Other', label: 'Other' },
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

