import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { DatePicker } from '../../components/forms/DatePicker';
import { formatDate, generateId } from '../../utils/formatters';
import { Season } from '../../types/entities';
import { Edit, Trash2, Plus, X, Check } from 'lucide-react';

export const Seasonal: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });

  const handleEdit = (season: Season) => {
    setEditingSeason(season);
    setFormData({
      name: season.name,
      startDate: season.startDate,
      endDate: season.endDate,
      isActive: season.isActive,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingSeason(null);
    setFormData({ name: '', startDate: '', endDate: '', isActive: true });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingSeason) {
      dispatch({
        type: 'UPDATE_SEASON',
        payload: { ...editingSeason, ...formData },
      });
    } else {
      dispatch({
        type: 'ADD_SEASON',
        payload: {
          id: generateId(),
          ...formData,
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (season: Season) => {
    if (window.confirm(`Are you sure you want to delete ${season.name}?`)) {
      dispatch({ type: 'DELETE_SEASON', payload: season.id });
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'startDate', header: 'Start Date', render: (s: Season) => formatDate(s.startDate) },
    { key: 'endDate', header: 'End Date', render: (s: Season) => formatDate(s.endDate) },
    {
      key: 'priceModifier',
      header: 'Price Modifier',
      render: (s: Season) => {
        // Get all pricing rules for this season
        const seasonalPricing = state.seasonalPricing.filter((sp) => sp.seasonId === s.id);
        if (seasonalPricing.length === 0) {
          return <span className="text-slate-500 text-sm">-</span>;
        }
        
        // Group by modifier type and show average or range
        const percentageModifiers = seasonalPricing
          .filter((sp) => sp.modifierType === 'percentage')
          .map((sp) => sp.modifierValue);
        const fixedModifiers = seasonalPricing
          .filter((sp) => sp.modifierType === 'fixed')
          .map((sp) => sp.modifierValue);
        
        if (percentageModifiers.length > 0) {
          const avgPercentage = percentageModifiers.reduce((a, b) => a + b, 0) / percentageModifiers.length;
          const minPercentage = Math.min(...percentageModifiers);
          const maxPercentage = Math.max(...percentageModifiers);
          
          if (minPercentage === maxPercentage) {
            return (
              <span className="text-sm font-semibold text-blue-700">
                {avgPercentage > 0 ? '+' : ''}{avgPercentage.toFixed(1)}%
              </span>
            );
          } else {
            return (
              <span className="text-sm font-semibold text-blue-700">
                {minPercentage > 0 ? '+' : ''}{minPercentage.toFixed(1)}% to {maxPercentage > 0 ? '+' : ''}{maxPercentage.toFixed(1)}%
              </span>
            );
          }
        } else if (fixedModifiers.length > 0) {
          const avgFixed = fixedModifiers.reduce((a, b) => a + b, 0) / fixedModifiers.length;
          return (
            <span className="text-sm font-semibold text-blue-700">
              ${avgFixed > 0 ? '+' : ''}{avgFixed.toFixed(2)}
            </span>
          );
        }
        
        return <span className="text-slate-500 text-sm">-</span>;
      },
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (s: Season) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            s.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
          }`}
        >
          {s.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s: Season) => (
        <div className="flex gap-2">
          <Button aria-label="Edit season" title="Edit season" size="sm" variant="outline" onClick={() => handleEdit(s)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button aria-label="Delete season" title="Delete season" size="sm" variant="danger" onClick={() => handleDelete(s)}>
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
            Seasons
          </h1>
          <p className="text-slate-600 mt-1 font-medium">Define seasonal periods for pricing</p>
        </div>
        <Button aria-label="Add season" title="Add season" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.seasons} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSeason ? 'Edit Season' : 'Add Season'}
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
          <DatePicker
            label="Start Date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <DatePicker
            label="End Date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
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

