import React, { useState, useEffect } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { formatDate } from "../../utils/formatters";
import { CurrencyRate as CurrencyRateEntity } from "../../types/entities";

export const CurrencyRate: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});

  // Currency Converter State
  const [amount, setAmount] = useState<string>("1");
  const [fromCurrency, setFromCurrency] = useState<string>("");
  const [toCurrency, setToCurrency] = useState<string>("");
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [isConverterExpanded, setIsConverterExpanded] = useState<boolean>(true);

  // Initialize default currencies when rates are available (USD to LKR)
  useEffect(() => {
    if (state.currencyRates.length >= 2 && !fromCurrency && !toCurrency) {
      const usd = state.currencyRates.find((cr) => cr.code === "USD");
      const lkr = state.currencyRates.find((cr) => cr.code === "LKR");

      if (usd && lkr) {
        setFromCurrency(usd.id);
        setToCurrency(lkr.id);
      } else {
        // Fallback to first two currencies if USD or LKR not found
        setFromCurrency(state.currencyRates[0].id);
        setToCurrency(state.currencyRates[1]?.id || state.currencyRates[0].id);
      }
    }
  }, [state.currencyRates, fromCurrency, toCurrency]);

  // Real-time conversion calculation
  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      const amountNum = parseFloat(amount);
      if (!isNaN(amountNum)) {
        const fromRate = state.currencyRates.find(
          (cr) => cr.id === fromCurrency
        );
        const toRate = state.currencyRates.find((cr) => cr.id === toCurrency);

        if (fromRate && toRate) {
          // Convert: amount * (toRate / fromRate)
          const result = amountNum * (toRate.rate / fromRate.rate);
          setConvertedAmount(result);
        }
      }
    }
  }, [amount, fromCurrency, toCurrency, state.currencyRates]);

  const handleSwapCurrencies = () => {
    const tempFrom = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(tempFrom);
  };

  const handleReset = () => {
    setAmount("1");
    if (state.currencyRates.length >= 2) {
      const usd = state.currencyRates.find((cr) => cr.code === "USD");
      const lkr = state.currencyRates.find((cr) => cr.code === "LKR");

      if (usd && lkr) {
        setFromCurrency(usd.id);
        setToCurrency(lkr.id);
      } else {
        // Fallback to first two currencies if USD or LKR not found
        setFromCurrency(state.currencyRates[0].id);
        setToCurrency(state.currencyRates[1]?.id || state.currencyRates[0].id);
      }
    }
  };

  const handleRateChange = (currencyId: string, rate: number) => {
    setEditingRates({ ...editingRates, [currencyId]: rate });
  };

  const handleSave = (currency: CurrencyRateEntity) => {
    const newRate = editingRates[currency.id];
    if (newRate !== undefined) {
      dispatch({
        type: "UPDATE_CURRENCY_RATE",
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
        type: "UPDATE_CURRENCY_RATE",
        payload: {
          ...currency,
          rate: parseFloat(newRate.toFixed(4)),
          lastUpdated: new Date().toISOString(),
        },
      });
    });
    alert("Currency rates updated!");
  };

  const columns = [
    { key: "currency", header: "Currency" },
    { key: "code", header: "Code" },
    {
      key: "rate",
      header: "Rate",
      render: (cr: CurrencyRateEntity) => {
        const isEditing = editingRates[cr.id] !== undefined;
        return (
          <div className="flex items-center gap-2 min-w-[300px]">
            {isEditing ? (
              <>
                <Input
                  type="number"
                  value={editingRates[cr.id]}
                  onChange={(e) =>
                    handleRateChange(cr.id, parseFloat(e.target.value) || 0)
                  }
                  className="w-32"
                  step="0.0001"
                />
                <button
                  onClick={() => handleSave(cr)}
                  className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    const newEditingRates = { ...editingRates };
                    delete newEditingRates[cr.id];
                    setEditingRates(newEditingRates);
                  }}
                  className="px-3 py-1.5 text-sm bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="font-mono font-medium text-slate-900 min-w-[80px]">
                  {cr.rate.toFixed(4)}
                </span>
                <button
                  onClick={() =>
                    setEditingRates({ ...editingRates, [cr.id]: cr.rate })
                  }
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        );
      },
    },
    {
      key: "lastUpdated",
      header: "Last Updated",
      render: (cr: CurrencyRateEntity) => formatDate(cr.lastUpdated),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Currency Rates
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Manage exchange rates for different currencies
          </p>
        </div>
        <Button onClick={handleAutoFetch}>Auto Fetch (Mock)</Button>
      </div>

      {/* Currency Converter */}
      <Card>
        <div className="border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Currency Converter
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Convert amounts between currencies using current rates
              </p>
            </div>
            <button
              onClick={() => setIsConverterExpanded(!isConverterExpanded)}
              className="text-slate-500 hover:text-slate-700 transition"
            >
              <svg
                className={`w-5 h-5 transition-transform ${
                  isConverterExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        {isConverterExpanded && (
          <div className="space-y-6">
            {/* Converter Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Amount
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  className="w-full text-lg"
                />
              </div>

              {/* From Currency */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  From Currency
                </label>
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {state.currencyRates.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.code} - {cr.currency}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Currency */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  To Currency
                </label>
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  {state.currencyRates.map((cr) => (
                    <option key={cr.id} value={cr.id}>
                      {cr.code} - {cr.currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conversion Result */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    You're converting
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {parseFloat(amount || "0").toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {state.currencyRates.find((cr) => cr.id === fromCurrency)
                      ?.code || ""}
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>

                <div className="flex-1 text-right">
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    Converted amount
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {convertedAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {state.currencyRates.find((cr) => cr.id === toCurrency)
                      ?.code || ""}
                  </p>
                </div>
              </div>

              {/* Exchange Rate Info */}
              {fromCurrency && toCurrency && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-slate-600">
                    1{" "}
                    {
                      state.currencyRates.find((cr) => cr.id === fromCurrency)
                        ?.code
                    }{" "}
                    ={" "}
                    {(() => {
                      const fromRate = state.currencyRates.find(
                        (cr) => cr.id === fromCurrency
                      );
                      const toRate = state.currencyRates.find(
                        (cr) => cr.id === toCurrency
                      );
                      if (fromRate && toRate) {
                        return (toRate.rate / fromRate.rate).toFixed(4);
                      }
                      return "0";
                    })()}{" "}
                    {
                      state.currencyRates.find((cr) => cr.id === toCurrency)
                        ?.code
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end flex-wrap">
              <Button
                variant="secondary"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset
              </Button>
              <Button
                onClick={handleSwapCurrencies}
                className="flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                Swap Currencies
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Currency Rates Table */}
      <Card>
        <h2 className="text-lg font-bold text-slate-900 mb-4">
          Exchange Rates
        </h2>
        <Table columns={columns} data={state.currencyRates} />
      </Card>
    </div>
  );
};
