import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { formatCurrency, generateId } from '../../utils/formatters';
import { RoomType } from '../../types/entities';
import { Edit, Trash2, Plus, X, Check } from 'lucide-react';

export const RoomTypes: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 2,
    basePrice: 0,
    viewTypeId: '',
  });

  const handleEdit = (roomType: RoomType) => {
    setEditingRoomType(roomType);
    setFormData({
      name: roomType.name,
      description: roomType.description,
      capacity: roomType.capacity,
      basePrice: roomType.basePrice,
      viewTypeId: roomType.viewTypeId || '',
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingRoomType(null);
    setFormData({ name: '', description: '', capacity: 2, basePrice: 0, viewTypeId: '' });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingRoomType) {
      dispatch({
        type: 'UPDATE_ROOM_TYPE',
        payload: { ...editingRoomType, ...formData, viewTypeId: formData.viewTypeId || undefined },
      });
    } else {
      dispatch({
        type: 'ADD_ROOM_TYPE',
        payload: {
          id: generateId(),
          ...formData,
          viewTypeId: formData.viewTypeId || undefined,
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (roomType: RoomType) => {
    if (window.confirm(`Are you sure you want to delete ${roomType.name}?`)) {
      dispatch({ type: 'DELETE_ROOM_TYPE', payload: roomType.id });
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'description', header: 'Description' },
    { key: 'capacity', header: 'Capacity' },
    { key: 'basePrice', header: 'Base Price', render: (rt: RoomType) => formatCurrency(rt.basePrice) },
    {
      key: 'viewType',
      header: 'View Type',
      render: (rt: RoomType) => {
        const viewType = state.viewTypes.find((vt) => vt.id === rt.viewTypeId);
        return viewType?.name || '-';
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (rt: RoomType) => (
        <div className="flex gap-2">
          <Button aria-label="Edit room type" title="Edit room type" size="sm" variant="outline" onClick={() => handleEdit(rt)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button aria-label="Delete room type" title="Delete room type" size="sm" variant="danger" onClick={() => handleDelete(rt)}>
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
            Room Types
          </h1>
          <p className="text-slate-600 mt-1 font-medium">Define and manage different room categories</p>
        </div>
        <Button aria-label="Add room type" title="Add room type" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.roomTypes} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRoomType ? 'Edit Room Type' : 'Add Room Type'}
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
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <Input
            type="number"
            label="Capacity"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 2 })}
            min={1}
            required
          />
          <Input
            type="number"
            label="Base Price"
            value={formData.basePrice}
            onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
            step="0.01"
            min={0}
            required
          />
          <Select
            label="View Type"
            value={formData.viewTypeId}
            onChange={(e) => setFormData({ ...formData, viewTypeId: e.target.value })}
            options={[{ value: '', label: 'None' }, ...state.viewTypes.map((vt) => ({ value: vt.id, label: vt.name }))]}
          />
        </div>
      </Modal>
    </div>
  );
};

