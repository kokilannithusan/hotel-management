import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatDate } from '../../utils/formatters';
import { CurrencyRate as CurrencyRateEntity } from '../../types/entities';

export const CurrencyRate: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});

  const handleRateChange = (currencyId: string, rate: number) => {
    setEditingRates({ ...editingRates, [currencyId]: rate });
  };

  const handleSave = (currency: CurrencyRateEntity) => {
    const newRate = editingRates[currency.id];
    if (newRate !== undefined) {
      dispatch({
        type: 'UPDATE_CURRENCY_RATE',
        payload: {
          ...currency,
          rate: newRate,
          lastUpdated: new Date().toISOString(),
        },
      });
      const newEditingRates = { ...editingRates };
      delete newEditingRates[currency.id];
      setEditingRates(newEditingRates);
    }
  };

  const handleAutoFetch = () => {
    // Mock auto-fetch - just update all rates slightly
    state.currencyRates.forEach((currency) => {
      const newRate = currency.rate * (0.95 + Math.random() * 0.1); // Random variation
      dispatch({
        type: 'UPDATE_CURRENCY_RATE',
        payload: {
          ...currency,
          rate: parseFloat(newRate.toFixed(4)),
          lastUpdated: new Date().toISOString(),
        },
      });
    });
    alert('Currency rates updated!');
  };

  const columns = [
    { key: 'currency', header: 'Currency' },
    { key: 'code', header: 'Code' },
    {
      key: 'rate',
      header: 'Rate',
      render: (cr: CurrencyRateEntity) => {
        const isEditing = editingRates[cr.id] !== undefined;
        return (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Input
                  type="number"
                  value={editingRates[cr.id]}
                  onChange={(e) => handleRateChange(cr.id, parseFloat(e.target.value) || 0)}
                  className="w-32"
                  step="0.0001"
                />
                <button
                  onClick={() => handleSave(cr)}
                  className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    const newEditingRates = { ...editingRates };
                    delete newEditingRates[cr.id];
                    setEditingRates(newEditingRates);
                  }}
                  className="px-2 py-1 text-sm bg-slate-500 text-white rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span>{cr.rate.toFixed(4)}</span>
                <button
                  onClick={() => setEditingRates({ ...editingRates, [cr.id]: cr.rate })}
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
    { key: 'lastUpdated', header: 'Last Updated', render: (cr: CurrencyRateEntity) => formatDate(cr.lastUpdated) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Currency Rates
          </h1>
          <p className="text-slate-600 mt-1 font-medium">Manage exchange rates for different currencies</p>
        </div>
        <Button onClick={handleAutoFetch}>Auto Fetch (Mock)</Button>
      </div>
      <Card>
        <Table columns={columns} data={state.currencyRates} />
      </Card>
    </div>
  );
};

