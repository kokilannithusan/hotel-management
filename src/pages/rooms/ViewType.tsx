import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { generateId } from '../../utils/formatters';
import { ViewType as ViewTypeEntity } from '../../types/entities';
import { Edit, Trash2, Plus, X, Check } from 'lucide-react';

export const ViewType: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingViewType, setEditingViewType] = useState<ViewTypeEntity | null>(null);
  const [formData, setFormData] = useState({ name: '', priceDifference: 0 });

  const handleEdit = (viewType: ViewTypeEntity) => {
    setEditingViewType(viewType);
    setFormData({
      name: viewType.name,
      priceDifference: viewType.priceDifference || 0,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingViewType(null);
    setFormData({ name: '', priceDifference: 0 });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingViewType) {
      dispatch({
        type: 'UPDATE_VIEW_TYPE',
        payload: { ...editingViewType, ...formData },
      });
    } else {
      dispatch({
        type: 'ADD_VIEW_TYPE',
        payload: {
          id: generateId(),
          ...formData,
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (viewType: ViewTypeEntity) => {
    if (window.confirm(`Are you sure you want to delete ${viewType.name}?`)) {
      dispatch({ type: 'DELETE_VIEW_TYPE', payload: viewType.id });
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    {
      key: 'priceDifference',
      header: 'Price Difference',
      render: (vt: ViewTypeEntity) => `$${vt.priceDifference || 0}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (vt: ViewTypeEntity) => (
        <div className="flex gap-2">
          <Button aria-label="Edit view type" title="Edit view type" size="sm" variant="outline" onClick={() => handleEdit(vt)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button aria-label="Delete view type" title="Delete view type" size="sm" variant="danger" onClick={() => handleDelete(vt)}>
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
            View Types
          </h1>
          <p className="text-slate-600 mt-1 font-medium">Manage room view types and pricing</p>
        </div>
        <Button aria-label="Add view type" title="Add view type" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.viewTypes} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingViewType ? 'Edit View Type' : 'Add View Type'}
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
            label="Price Difference"
            value={formData.priceDifference}
            onChange={(e) => setFormData({ ...formData, priceDifference: parseFloat(e.target.value) || 0 })}
            step="0.01"
          />
        </div>
      </Modal>
    </div>
  );
};

