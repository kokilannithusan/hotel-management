import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { generateId } from '../../utils/formatters';
import { SeasonalPricing } from '../../types/entities';
import { Edit, Trash2, Plus, X, Check } from 'lucide-react';

export const SeasonalPricingPage: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState<SeasonalPricing | null>(null);
  const [formData, setFormData] = useState({
    seasonId: '',
    roomTypeId: '',
    modifierType: 'percentage' as 'percentage' | 'fixed',
    modifierValue: 0,
  });

  const handleEdit = (pricing: SeasonalPricing) => {
    setEditingPricing(pricing);
    setFormData({
      seasonId: pricing.seasonId,
      roomTypeId: pricing.roomTypeId,
      modifierType: pricing.modifierType,
      modifierValue: pricing.modifierValue,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingPricing(null);
    setFormData({ seasonId: '', roomTypeId: '', modifierType: 'percentage', modifierValue: 0 });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingPricing) {
      dispatch({
        type: 'UPDATE_SEASONAL_PRICING',
        payload: { ...editingPricing, ...formData },
      });
    } else {
      dispatch({
        type: 'ADD_SEASONAL_PRICING',
        payload: {
          id: generateId(),
          ...formData,
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (pricing: SeasonalPricing) => {
    if (window.confirm('Are you sure you want to delete this pricing rule?')) {
      dispatch({ type: 'DELETE_SEASONAL_PRICING', payload: pricing.id });
    }
  };

  const columns = [
    {
      key: 'season',
      header: 'Season',
      render: (sp: SeasonalPricing) => {
        const season = state.seasons.find((s) => s.id === sp.seasonId);
        return season?.name || 'Unknown';
      },
    },
    {
      key: 'roomType',
      header: 'Room Type',
      render: (sp: SeasonalPricing) => {
        const roomType = state.roomTypes.find((rt) => rt.id === sp.roomTypeId);
        return roomType?.name || 'Unknown';
      },
    },
    {
      key: 'modifier',
      header: 'Modifier',
      render: (sp: SeasonalPricing) =>
        sp.modifierType === 'percentage' ? `+${sp.modifierValue}%` : `+$${sp.modifierValue}`,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (sp: SeasonalPricing) => (
        <div className="flex gap-2">
          <Button aria-label="Edit pricing" title="Edit pricing" size="sm" variant="outline" onClick={() => handleEdit(sp)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button aria-label="Delete pricing" title="Delete pricing" size="sm" variant="danger" onClick={() => handleDelete(sp)}>
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
            Seasonal Pricing
          </h1>
          <p className="text-slate-600 mt-1 font-medium">Configure seasonal rate adjustments</p>
        </div>
        <Button aria-label="Add pricing rule" title="Add pricing rule" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.seasonalPricing} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPricing ? 'Edit Seasonal Pricing' : 'Add Seasonal Pricing'}
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
          <Select
            label="Season"
            value={formData.seasonId}
            onChange={(e) => setFormData({ ...formData, seasonId: e.target.value })}
            options={state.seasons.map((s) => ({ value: s.id, label: s.name }))}
            required
          />
          <Select
            label="Room Type"
            value={formData.roomTypeId}
            onChange={(e) => setFormData({ ...formData, roomTypeId: e.target.value })}
            options={state.roomTypes.map((rt) => ({ value: rt.id, label: rt.name }))}
            required
          />
          <Select
            label="Modifier Type"
            value={formData.modifierType}
            onChange={(e) => setFormData({ ...formData, modifierType: e.target.value as 'percentage' | 'fixed' })}
            options={[
              { value: 'percentage', label: 'Percentage' },
              { value: 'fixed', label: 'Fixed Amount' },
            ]}
          />
          <Input
            type="number"
            label={formData.modifierType === 'percentage' ? 'Percentage (%)' : 'Fixed Amount ($)'}
            value={formData.modifierValue}
            onChange={(e) => setFormData({ ...formData, modifierValue: parseFloat(e.target.value) || 0 })}
            step="0.01"
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export { SeasonalPricingPage as SeasonalPricing };

