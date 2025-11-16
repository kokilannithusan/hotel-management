import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { generateId } from '../../utils/formatters';
import { Channel, ChannelStatus } from '../../types/entities';
import { Edit, Trash2, Plus, X, Check } from 'lucide-react';

export const ReservationType: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    apiKey: string;
    contactPerson: string;
    status: ChannelStatus;
  }>({
    name: '',
    type: 'Direct',
    apiKey: '',
    contactPerson: '',
    status: 'active',
  });

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setFormData({
      name: channel.name,
      type: channel.type,
      apiKey: channel.apiKey || '',
      contactPerson: channel.contactPerson || '',
      status: channel.status,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingChannel(null);
    setFormData({ name: '', type: 'Direct', apiKey: '', contactPerson: '', status: 'active' });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingChannel) {
      dispatch({
        type: 'UPDATE_CHANNEL',
        payload: { ...editingChannel, ...formData },
      });
    } else {
      dispatch({
        type: 'ADD_CHANNEL',
        payload: {
          id: generateId(),
          ...formData,
        },
      });
    }
    setShowModal(false);
  };

  const handleDelete = (channel: Channel) => {
    if (window.confirm(`Are you sure you want to delete ${channel.name}?`)) {
      dispatch({ type: 'DELETE_CHANNEL', payload: channel.id });
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type' },
    { key: 'apiKey', header: 'API Key', render: (c: Channel) => c.apiKey || '-' },
    { key: 'contactPerson', header: 'Contact', render: (c: Channel) => c.contactPerson || '-' },
    {
      key: 'priceModifier',
      header: 'Price Modifier',
      render: (c: Channel) => {
        // Get all pricing rules for this channel
        const channelPricing = state.channelPricing.filter((cp) => cp.channelId === c.id);
        if (channelPricing.length === 0) {
          return <span className="text-slate-500 text-sm">-</span>;
        }
        
        // Group by modifier type and show average or range
        const percentageModifiers = channelPricing
          .filter((cp) => cp.modifierType === 'percentage')
          .map((cp) => cp.modifierValue);
        const fixedModifiers = channelPricing
          .filter((cp) => cp.modifierType === 'fixed')
          .map((cp) => cp.modifierValue);
        
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
      key: 'status',
      header: 'Status',
      render: (c: Channel) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            c.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
          }`}
        >
          {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: Channel) => (
        <div className="flex gap-2">
          <Button aria-label="Edit channel" title="Edit channel" size="sm" variant="outline" onClick={() => handleEdit(c)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button aria-label="Delete channel" title="Delete channel" size="sm" variant="danger" onClick={() => handleDelete(c)}>
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
            Reservation Types (Channels)
          </h1>
          <p className="text-slate-600 mt-1 font-medium">Manage booking channels and sources</p>
        </div>
        <Button aria-label="Add channel" title="Add channel" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <Card>
        <Table columns={columns} data={state.channels} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingChannel ? 'Edit Channel' : 'Add Channel'}
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
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'Direct', label: 'Direct' },
              { value: 'OTA', label: 'OTA' },
              { value: 'Agent', label: 'Agent' },
              { value: 'Walk-in', label: 'Walk-in' },
            ]}
          />
          <Input
            label="API Key (optional)"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
          />
          <Input
            label="Contact Person (optional)"
            value={formData.contactPerson}
            onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as ChannelStatus })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};

