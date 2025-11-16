import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Input } from '../../components/ui/Input';
import { formatCurrency } from '../../utils/formatters';
import { RoomType } from '../../types/entities';

export const Price: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});

  const handlePriceChange = (roomTypeId: string, price: number) => {
    setEditingPrices({ ...editingPrices, [roomTypeId]: price });
  };

  const handleSave = (roomType: RoomType) => {
    const newPrice = editingPrices[roomType.id];
    if (newPrice !== undefined) {
      dispatch({
        type: 'UPDATE_ROOM_TYPE',
        payload: { ...roomType, basePrice: newPrice },
      });
      const newEditingPrices = { ...editingPrices };
      delete newEditingPrices[roomType.id];
      setEditingPrices(newEditingPrices);
    }
  };

  const columns = [
    { key: 'name', header: 'Room Type' },
    { key: 'description', header: 'Description' },
    {
      key: 'basePrice',
      header: 'Base Price',
      render: (rt: RoomType) => {
        const isEditing = editingPrices[rt.id] !== undefined;
        return (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Input
                  type="number"
                  value={editingPrices[rt.id]}
                  onChange={(e) => handlePriceChange(rt.id, parseFloat(e.target.value) || 0)}
                  className="w-32"
                  step="0.01"
                />
                <button
                  onClick={() => handleSave(rt)}
                  className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    const newEditingPrices = { ...editingPrices };
                    delete newEditingPrices[rt.id];
                    setEditingPrices(newEditingPrices);
                  }}
                  className="px-2 py-1 text-sm bg-slate-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span>{formatCurrency(rt.basePrice)}</span>
                <button
                  onClick={() => setEditingPrices({ ...editingPrices, [rt.id]: rt.basePrice })}
                  className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          Room Pricing
        </h1>
        <p className="text-slate-600 mt-1 font-medium">Set and manage room rates and pricing</p>
      </div>
      <Card>
        <Table columns={columns} data={state.roomTypes} />
      </Card>
    </div>
  );
};

