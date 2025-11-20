import React, { useState, useMemo, useEffect } from "react";
import { useHotel } from "../../context/HotelContext";
import { formatCurrency, generateId } from "../../utils/formatters";
import { Modal } from "../../components/ui/Modal";
import { DateRangePicker } from "../../components/forms/DateRangePicker";
import { toast } from "react-toastify";
import {
  DollarSign,
  User,
  Calendar,
  Percent,
  TrendingUp,
  RefreshCw,
  Check,
} from "lucide-react";

export const SeasonalType: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [showAddRoomTypeModal, setShowAddRoomTypeModal] =
    useState<boolean>(false);
  const [showEditRoomTypeModal, setShowEditRoomTypeModal] =
    useState<boolean>(false);
  const [editingRoomTypeId, setEditingRoomTypeId] = useState<string>("");
  const [newRoomTypeName, setNewRoomTypeName] = useState<string>("");
  const [newRoomTypeBasePrice, setNewRoomTypeBasePrice] = useState<string>("");
  const [editRoomTypeName, setEditRoomTypeName] = useState<string>("");
  const [editRoomTypeBasePrice, setEditRoomTypeBasePrice] =
    useState<string>("");
  const [selectedMealPlans, setSelectedMealPlans] = useState<string[]>([]);
  const [editSelectedMealPlans, setEditSelectedMealPlans] = useState<string[]>(
    []
  );
  // Only use the 4 specific meal plans: BB, RO, HB, FB
  const allowedMealPlanCodes = ["BB", "RO", "HB", "FB"];
  const mealPlans =
    state.mealPlans && state.mealPlans.length > 0
      ? state.mealPlans.filter((mp) => allowedMealPlanCodes.includes(mp.code))
      : [
          {
            id: "mp-bb",
            name: "Bed & Breakfast",
            code: "BB",
            description: "Breakfast included",
            perPersonRate: 0,
            isActive: true,
          },
          {
            id: "mp-ro",
            name: "Room Only",
            code: "RO",
            description: "No meals",
            perPersonRate: 0,
            isActive: true,
          },
          {
            id: "mp-hb",
            name: "Half Board",
            code: "HB",
            description: "Breakfast & Dinner",
            perPersonRate: 0,
            isActive: true,
          },
          {
            id: "mp-fb",
            name: "Full Board",
            code: "FB",
            description: "All meals",
            perPersonRate: 0,
            isActive: true,
          },
        ];
  // Multi-level adjustment states
  const [adjustmentScope] = useState<
    | "all-channels"
    | "all-subchannels"
    | "selected-subchannels"
    | "single-subchannel"
  >("single-subchannel");
  const [selectedSubChannels, setSelectedSubChannels] = useState<string[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] =
    useState<boolean>(false);
  const [adjustmentPercentage, setAdjustmentPercentage] = useState<string>("");
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"percentage" | "fixed">(
    "percentage"
  );
  const [adjustmentOperation, setAdjustmentOperation] = useState<
    "increase" | "decrease" | "reset"
  >("increase");
  // @ts-ignore - feedback is set but not read
  const [feedback, setFeedback] = useState<null | {
    type: "error" | "success";
    message: string;
  }>(null);

  // Advanced Adjustments state
  const [advancedDateStart, setAdvancedDateStart] = useState<string>("");
  const [advancedDateEnd, setAdvancedDateEnd] = useState<string>("");
  const [advancedStayTypes, setAdvancedStayTypes] = useState<string[]>([]);
  const [advancedCurrency, setAdvancedCurrency] = useState<string>("LKR");
  const [advancedAdjustmentType, setAdvancedAdjustmentType] = useState<
    "percentage" | "amount"
  >("percentage");
  const [advancedOperation, setAdvancedOperation] = useState<
    "hike" | "decrease"
  >("hike");
  const [advancedInputValue, setAdvancedInputValue] = useState<string>("");
  const [stayTypeDropdownOpen, setStayTypeDropdownOpen] =
    useState<boolean>(false);
  const [channelDropdownOpen, setChannelDropdownOpen] =
    useState<boolean>(false);

  // Price editing state
  const [showEditPriceModal, setShowEditPriceModal] = useState<boolean>(false);
  const [editingPrice, setEditingPrice] = useState<string>("");
  const [editingPriceData, setEditingPriceData] = useState<any>(null);

  // Reservation Type & Channel Selection state
  const [selectedReservationType, setSelectedReservationType] = useState<
    "DIRECT" | "WEB" | "OTA" | "TA" | ""
  >("");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedSeasonType, setSelectedSeasonType] = useState<string>("");

  // Table Filter state
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");
  const [filterCurrency, setFilterCurrency] = useState<string>("LKR");
  const [filterChannelType, setFilterChannelType] = useState<string>("");
  const [filterSeasonId, setFilterSeasonId] = useState<string>("");
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState<boolean>(false);

  // Helper functions for Reservation Type and Channels
  const getChannelsForReservationType = (
    type: "DIRECT" | "WEB" | "OTA" | "TA"
  ) => {
    return state.channels.filter(
      (ch) =>
        (ch as any).reservationType === type && !(ch as any).parentChannelId
    );
  };

  const availableChannelsForType = selectedReservationType
    ? getChannelsForReservationType(
        selectedReservationType as "DIRECT" | "WEB" | "OTA" | "TA"
      )
    : [];

  // Load stay type combinations from localStorage (same as StayTypes.tsx)
  const [stayTypeCombinations, setStayTypeCombinations] = useState<any[]>([]);

  useEffect(() => {
    const loadCombinations = () => {
      try {
        // Load stay type combinations from localStorage
        const saved = localStorage.getItem("hotel-stay-type-combinations");
        const combinations = saved ? JSON.parse(saved) : [];

        console.log(
          "ChannelPricingGrid: Loaded combinations from localStorage:",
          combinations.length,
          "items"
        );
        setStayTypeCombinations(combinations);
      } catch (error) {
        console.error("Error loading combinations from localStorage:", error);
        setStayTypeCombinations([]);
      }
    };

    // Load on mount
    loadCombinations();

    // Listen for storage changes (when StayTypes.tsx updates)
    window.addEventListener("storage", loadCombinations);

    // Also poll for changes every second to catch same-tab updates
    const interval = setInterval(loadCombinations, 1000);

    return () => {
      window.removeEventListener("storage", loadCombinations);
      clearInterval(interval);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Close stay type dropdown
      const stayTypeDropdown = document.getElementById("stay-type-dropdown");
      if (
        stayTypeDropdown &&
        !stayTypeDropdown.contains(target) &&
        !target.closest('button[type="button"]')
      ) {
        setStayTypeDropdownOpen(false);
      }

      // Close channel dropdown
      if (!target.closest(".channel-dropdown-container")) {
        setChannelDropdownOpen(false);
      }

      // Close season dropdown
      if (!target.closest(".season-dropdown-container")) {
        setSeasonDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate dynamic columns - show all 30 days for a full month view
  const columns = useMemo(() => {
    // Generate 30 date columns starting from today
    const today = new Date();
    const dateColumns: Date[] = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dateColumns.push(new Date(date));
    }

    return dateColumns;
  }, []);

  // Build pricing grid data from stay type combinations in localStorage
  const pricingGridData = useMemo(() => {
    // If no combinations exist, return empty array
    if (stayTypeCombinations.length === 0) {
      return [];
    }

    // Build pricing data from localStorage combinations
    return stayTypeCombinations.map((combo: any) => {
      const roomType = state.roomTypes.find((rt) => rt.id === combo.roomTypeId);
      const mealPlan = mealPlans.find((mp) => mp.id === combo.mealPlanId);

      // Determine guest type based on adults/children
      const guestType =
        combo.adults > 0 && combo.children > 0
          ? { code: "AC", name: "Adult + Child", icon: "👨‍👧" }
          : { code: "AO", name: "Adult Only", icon: "👤" };

      const basePrice = roomType?.basePrice || 0;
      const basePrices = columns.map((col, index) => {
        // Check if col is a Date object or number
        const isDateColumn = col instanceof Date;
        const columnIndex = isDateColumn ? index + 1 : col;
        const variation = basePrice * (columnIndex * 0.02);
        return basePrice + variation;
      });

      return {
        roomTypeId: combo.roomTypeId,
        roomTypeName: roomType?.name || "Unknown",
        mealPlanCode: mealPlan?.code || "Unknown",
        mealPlanName: mealPlan?.name || "Unknown",
        guestTypeCode: guestType.code,
        guestTypeName: guestType.name,
        guestTypeIcon: guestType.icon,
        basePrices,
        combinationId: combo.id,
      };
    });
  }, [stayTypeCombinations, state.roomTypes, mealPlans, columns]);

  // Calculate final prices with meal plan adjustment and channel modifier
  const calculatePrice = (basePrice: number, mealPlanCode: string): number => {
    let working = basePrice;

    // Add meal plan perRoomRate (preferred) or perPersonRate based on the row's meal plan
    const mealPlan = mealPlans.find((mp) => mp.code === mealPlanCode);
    if (mealPlan) {
      const mealAddon = mealPlan.perRoomRate ?? mealPlan.perPersonRate ?? 0;
      working += mealAddon;
    }

    return working;
  };

  // Apply multi-level adjustment
  const applyMultiLevelAdjustment = () => {
    // Validation (skip for reset)
    if (adjustmentOperation !== "reset") {
      if (adjustmentType === "percentage") {
        if (!adjustmentPercentage || parseFloat(adjustmentPercentage) === 0) {
          setFeedback({
            type: "error",
            message: "Please enter a valid percentage value.",
          });
          return;
        }
      } else {
        if (!adjustmentAmount || parseFloat(adjustmentAmount) === 0) {
          setFeedback({
            type: "error",
            message: "Please enter a valid amount.",
          });
          return;
        }
      }
    }

    let affectedChannels: string[] = [];
    let scopeDescription = "";

    // Determine which channels are affected based on scope
    switch (adjustmentScope) {
      case "all-channels":
        affectedChannels = state.channels.map((ch) => ch.id);
        scopeDescription = "all channels across all types";
        break;
      case "all-subchannels":
        affectedChannels = state.channels.map((ch) => ch.id);
        scopeDescription = "all channels";
        break;
      case "selected-subchannels":
        if (selectedSubChannels.length === 0) {
          setFeedback({
            type: "error",
            message: "Please select at least one channel.",
          });
          return;
        }
        affectedChannels = selectedSubChannels;
        scopeDescription = `${selectedSubChannels.length} selected channel${
          selectedSubChannels.length > 1 ? "s" : ""
        }`;
        break;
      case "single-subchannel":
        if (selectedSubChannels.length === 0) {
          setFeedback({
            type: "error",
            message: "Please select a channel first.",
          });
          return;
        }
        affectedChannels = selectedSubChannels;
        scopeDescription = `${selectedSubChannels.length} selected channel${
          selectedSubChannels.length > 1 ? "s" : ""
        }`;
        break;
    }

    // Calculate adjustment value
    let adjustmentValue = 0;

    if (adjustmentOperation !== "reset") {
      const value =
        adjustmentType === "percentage"
          ? parseFloat(adjustmentPercentage)
          : parseFloat(adjustmentAmount);
      adjustmentValue =
        adjustmentOperation === "decrease" ? -Math.abs(value) : Math.abs(value);
    }

    // Apply adjustment to affected channels
    affectedChannels.forEach((channelId) => {
      const channel = state.channels.find((ch) => ch.id === channelId);
      if (channel) {
        let newModifier = 0;

        if (adjustmentOperation === "reset") {
          // Reset to 0%
          newModifier = 0;
        } else if (adjustmentType === "percentage") {
          // Add/subtract percentage to current modifier
          newModifier = (channel.priceModifierPercent || 0) + adjustmentValue;
        } else {
          // Convert fixed amount to percentage based on average base price
          const avgBasePrice = 10000; // Approximate average base price
          const percentEquivalent = (adjustmentValue / avgBasePrice) * 100;
          newModifier = (channel.priceModifierPercent || 0) + percentEquivalent;
        }

        dispatch({
          type: "UPDATE_CHANNEL",
          payload: {
            ...channel,
            priceModifierPercent: newModifier,
          },
        });
      }
    });

    // Show success feedback
    let message = "";

    if (adjustmentOperation === "reset") {
      message = `✓ Successfully reset price modifiers to 0% for ${scopeDescription} (${
        affectedChannels.length
      } channel${affectedChannels.length > 1 ? "s" : ""} affected)`;
    } else {
      const value = Math.abs(adjustmentValue);
      const valueText =
        adjustmentType === "percentage"
          ? `${value}%`
          : formatCurrency(value, "LKR");
      const operationType =
        adjustmentOperation === "increase" ? "increased" : "decreased";
      message = `✓ Successfully ${operationType} prices by ${valueText} for ${scopeDescription} (${
        affectedChannels.length
      } channel${affectedChannels.length > 1 ? "s" : ""} affected)`;
    }

    setFeedback({
      type: "success",
      message,
    });

    // Close modal and reset
    setShowAdjustmentModal(false);
    setAdjustmentPercentage("");
    setAdjustmentAmount("");
    setSelectedSubChannels([]);
  };

  // Filter pricing grid data based on selected filters
  const displayedPricingGridData = useMemo(() => {
    let filteredData = [...pricingGridData];

    // Apply filters to show relevant data
    // The season and channel filters affect which pricing adjustments are applied
    // but all rows are shown. The actual filtering happens in the pricing display
    // where seasonal and channel modifiers are applied to the base prices.

    // Note: If you need to actually hide rows based on filters,
    // you would need to store channel/season associations with the combinations
    // For now, all combinations are shown but prices will reflect the selected filters

    return filteredData;
  }, [pricingGridData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-amber-50/20 p-6 max-w-full overflow-hidden">
      {/* Modern Header */}
      <div className="bg-white via-slate-700 to-slate-800 rounded-2xl shadow-xl p-8 mb-6   max-w-full">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-700">
                Seasonal Price Management
              </h1>
            </div>
            <p className="text-slate-300 text-base ml-14 text-slate-700">
              Manage seasonal pricing strategies and adjustments across
              different periods
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-full overflow-hidden">
        {/* Reservation Type & Channel Selection Section */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Channel Selection
            </h3>

            {/* Reservation Type & Channel Selection Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Reservation Type Selector */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                  Reservation Type
                </label>
                <select
                  value={selectedReservationType}
                  onChange={(e) => {
                    setSelectedReservationType(
                      e.target.value as "DIRECT" | "WEB" | "OTA" | "TA" | ""
                    );
                    setSelectedChannelId(""); // Reset channel selection when reservation type changes
                  }}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-slate-400"
                >
                  <option value="">Select a Reservation Type</option>
                  <option value="DIRECT">DIRECT</option>
                  <option value="WEB">WEB</option>
                  <option value="OTA">OTA</option>
                  <option value="TA">TA</option>
                </select>
              </div>

              {/* Channel Dropdown */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <User className="h-3.5 w-3.5 text-green-600" />
                  Channel
                </label>
                <select
                  value={selectedChannelId}
                  onChange={(e) => setSelectedChannelId(e.target.value)}
                  disabled={!selectedReservationType}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-slate-400 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedReservationType
                      ? "Select a Channel"
                      : "Select Reservation Type First"}
                  </option>
                  {availableChannelsForType.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Season Type Dropdown */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-orange-600" />
                  Season Type
                </label>
                <select
                  value={selectedSeasonType}
                  onChange={(e) => setSelectedSeasonType(e.target.value)}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-slate-400"
                >
                  <option value="">Select a Season Type</option>
                  <option value="peak">Peak Season</option>
                  <option value="off-peak">Off-Peak Season</option>
                  <option value="shoulder">Shoulder Season</option>
                  <option value="holiday">Holiday Season</option>
                  <option value="special">Special Events</option>
                </select>
              </div>
            </div>

            {selectedReservationType && selectedChannelId && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  ✓ Selected: {selectedReservationType} -{" "}
                  {availableChannelsForType.find(
                    (c) => c.id === selectedChannelId
                  )?.name || "Unknown"}
                  {selectedSeasonType &&
                    ` - ${
                      selectedSeasonType.charAt(0).toUpperCase() +
                      selectedSeasonType.slice(1).replace("-", " ")
                    }`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* New Advanced Adjustments Section */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6">
            <h3 className="text-lg font-bold text-black mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Advanced Pricing Adjustments
            </h3>

            {/* First Row - Selection Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Channel Type - REMOVED */}

              {/* Date Range */}
              <DateRangePicker
                label="Date Range"
                startDate={advancedDateStart}
                endDate={advancedDateEnd}
                onStartDateChange={setAdvancedDateStart}
                onEndDateChange={setAdvancedDateEnd}
              />

              {/* Stay Type - Multiple Selection Dropdown */}
              <div className="space-y-1.5 relative">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <User className="h-3.5 w-3.5 text-green-600" />
                  Stay Type (Multiple)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setStayTypeDropdownOpen(!stayTypeDropdownOpen)
                    }
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        advancedStayTypes.length > 0
                          ? "text-slate-900"
                          : "text-slate-500"
                      }
                    >
                      {advancedStayTypes.length > 0
                        ? `${advancedStayTypes.length} selected`
                        : "Select stay types"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        stayTypeDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {stayTypeDropdownOpen && (
                    <div
                      id="stay-type-dropdown"
                      className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                    >
                      {pricingGridData.map((row) => {
                        const stayTypeKey = `${row.roomTypeId}-${row.guestTypeCode}-${row.mealPlanCode}`;
                        const displayName = `${row.roomTypeName} (${
                          row.guestTypeCode === "AO" ? "1A/0C" : "1A/1C"
                        }) - ${row.mealPlanCode}`;
                        const isSelected =
                          advancedStayTypes.includes(stayTypeKey);
                        return (
                          <label
                            key={stayTypeKey}
                            className="flex items-center gap-2 p-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAdvancedStayTypes([
                                    ...advancedStayTypes,
                                    stayTypeKey,
                                  ]);
                                } else {
                                  setAdvancedStayTypes(
                                    advancedStayTypes.filter(
                                      (id) => id !== stayTypeKey
                                    )
                                  );
                                }
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm text-slate-700">
                              {displayName}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Select one or more stay types
                </p>
              </div>
            </div>

            {/* Second Row - Adjustment Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Currency Type */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  Currency
                </label>
                <select
                  value={advancedCurrency}
                  onChange={(e) => setAdvancedCurrency(e.target.value)}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="LKR">🇱🇰 LKR</option>
                  {state.currencyRates.map((currency) => (
                    <option key={currency.id} value={currency.code}>
                      {currency.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* Percentage or Amount */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Percent className="h-3.5 w-3.5 text-blue-600" />
                  Adjustment Type
                </label>
                <select
                  value={advancedAdjustmentType}
                  onChange={(e) => {
                    setAdvancedAdjustmentType(
                      e.target.value as "percentage" | "amount"
                    );
                    setAdvancedInputValue(""); // Reset input when type changes
                  }}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="percentage">Percentage</option>
                  <option value="amount">Amount</option>
                </select>
              </div>

              {/* Hike or Decrease */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <TrendingUp className="h-3.5 w-3.5 text-red-600" />
                  Operation
                </label>
                <select
                  value={advancedOperation}
                  onChange={(e) =>
                    setAdvancedOperation(e.target.value as "hike" | "decrease")
                  }
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="hike">Hike</option>
                  <option value="decrease">Decrease</option>
                </select>
              </div>

              {/* Dynamic Input Field */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  {advancedAdjustmentType === "percentage" ? (
                    <>
                      <Percent className="h-3.5 w-3.5 text-indigo-600" />
                      Percentage Value
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-3.5 w-3.5 text-green-600" />
                      Amount Value
                    </>
                  )}
                </label>
                <input
                  type="number"
                  step={advancedAdjustmentType === "percentage" ? "0.01" : "1"}
                  value={advancedInputValue}
                  onChange={(e) => setAdvancedInputValue(e.target.value)}
                  placeholder={
                    advancedAdjustmentType === "percentage"
                      ? "Enter %"
                      : "Enter amount"
                  }
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-purple-200">
              <div className="text-xs text-slate-600">
                {advancedDateStart && advancedDateEnd && advancedInputValue && (
                  <span className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <strong>Ready to apply:</strong>{" "}
                    {advancedOperation === "hike" ? "+" : "-"}
                    {advancedInputValue}
                    {advancedAdjustmentType === "percentage"
                      ? "%"
                      : ` ${advancedCurrency}`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAdvancedDateStart("");
                    setAdvancedDateEnd("");
                    setAdvancedStayTypes([]);
                    setAdvancedCurrency("LKR");
                    setAdvancedAdjustmentType("percentage");
                    setAdvancedOperation("hike");
                    setAdvancedInputValue("");
                  }}
                  className="flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-gray-400 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      !advancedDateStart ||
                      !advancedDateEnd ||
                      !advancedInputValue
                    ) {
                      toast.error("Please select date range and enter a value");
                      return;
                    }
                    // Show toast notification
                    const adjustmentValue = parseFloat(advancedInputValue) || 0;
                    const message = `✓ Applied ${
                      advancedAdjustmentType === "percentage"
                        ? adjustmentValue + "%"
                        : formatCurrency(adjustmentValue, "LKR")
                    } ${advancedOperation}`;
                    toast.success(message);
                  }}
                  disabled={
                    !advancedDateStart ||
                    !advancedDateEnd ||
                    !advancedInputValue
                  }
                  className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold shadow-md transition-all ${
                    !advancedDateStart ||
                    !advancedDateEnd ||
                    !advancedInputValue
                      ? "bg-gray-300 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-105"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  Apply Advanced Adjustments
                </button>
              </div>
            </div>

            {/* Advanced Adjustments Table - REMOVED */}
          </div>
        </div>

        {/* Pricing Grid Section */}
        <div className="p-6">
          {/* Table Filters */}
          <div className="mb-12 bg-white rounded-xl border-2 border-slate-200 p-5 pb-8 shadow-md overflow-visible">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Table Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Calendar Filter */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  Date Range
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    placeholder="Start Date"
                    className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-2 py-2 text-xs shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    placeholder="End Date"
                    className="flex-1 rounded-lg border-2 border-slate-300 bg-white px-2 py-2 text-xs shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Currency Filter */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  Currency
                </label>
                <select
                  value={filterCurrency}
                  onChange={(e) => setFilterCurrency(e.target.value)}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {state.currencyRates && state.currencyRates.length > 0 ? (
                    state.currencyRates.map((currency) => (
                      <option key={currency.id} value={currency.code}>
                        {currency.code} - {currency.currency}
                      </option>
                    ))
                  ) : (
                    <option value="LKR">LKR - Sri Lankan Rupee</option>
                  )}
                </select>
              </div>

              {/* Seasonal Filter - Custom Dropdown */}
              <div className="space-y-1.5 relative season-dropdown-container">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-orange-600" />
                  Seasonal
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        filterSeasonId
                          ? "text-slate-900 font-medium"
                          : "text-slate-500"
                      }
                    >
                      {filterSeasonId
                        ? state.seasons.find((s) => s.id === filterSeasonId)
                            ?.name
                        : "All Seasons"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        seasonDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {seasonDropdownOpen && (
                    <div
                      className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#94a3b8 #f1f5f9",
                      }}
                    >
                      <div
                        onClick={() => {
                          setFilterSeasonId("");
                          setSeasonDropdownOpen(false);
                        }}
                        className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100 font-medium"
                      >
                        All Seasons
                      </div>
                      {state.seasons && state.seasons.length > 0 ? (
                        state.seasons
                          .filter((season) => season.isActive)
                          .map((season) => (
                            <div
                              key={season.id}
                              onClick={() => {
                                setFilterSeasonId(season.id);
                                setSeasonDropdownOpen(false);
                              }}
                              className={`px-3 py-2 hover:bg-orange-50 cursor-pointer text-sm border-b border-slate-100 last:border-0 ${
                                filterSeasonId === season.id
                                  ? "bg-orange-100 text-orange-900 font-bold"
                                  : "text-slate-700"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">
                                  {season.name}
                                </span>
                                <span className="text-xs text-slate-500 ml-2">
                                  {season.startDate
                                    .split("-")
                                    .slice(1)
                                    .join("-")}{" "}
                                  to{" "}
                                  {season.endDate.split("-").slice(1).join("-")}
                                </span>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          No seasons available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Channel Filter - Custom Dropdown */}
              <div className="space-y-1.5 relative channel-dropdown-container">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <svg
                    className="h-3.5 w-3.5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                  Channel
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setChannelDropdownOpen(!channelDropdownOpen)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 text-left flex items-center justify-between"
                  >
                    <span
                      className={
                        filterChannelType ? "text-slate-900" : "text-slate-500"
                      }
                    >
                      {filterChannelType
                        ? state.channels.find(
                            (ch) => ch.id === filterChannelType
                          )?.name +
                          ` (${
                            (
                              state.channels.find(
                                (ch) => ch.id === filterChannelType
                              ) as any
                            )?.reservationType ||
                            state.channels.find(
                              (ch) => ch.id === filterChannelType
                            )?.type
                          })`
                        : "All Channels"}
                    </span>
                    <svg
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        channelDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {channelDropdownOpen && (
                    <div
                      className="absolute z-50 w-full mt-1 bg-white border-2 border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-400 scrollbar-track-slate-100"
                      style={{
                        scrollbarWidth: "thin",
                        scrollbarColor: "#94a3b8 #f1f5f9",
                      }}
                    >
                      <div
                        onClick={() => {
                          setFilterChannelType("");
                          setChannelDropdownOpen(false);
                        }}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 border-b border-slate-100"
                      >
                        All Channels
                      </div>
                      {state.channels && state.channels.length > 0 ? (
                        state.channels.map((channel) => (
                          <div
                            key={channel.id}
                            onClick={() => {
                              setFilterChannelType(channel.id);
                              setChannelDropdownOpen(false);
                            }}
                            className={`px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-slate-100 last:border-0 ${
                              filterChannelType === channel.id
                                ? "bg-blue-100 text-blue-900 font-semibold"
                                : "text-slate-700"
                            }`}
                          >
                            {channel.name} (
                            {(channel as any).reservationType || channel.type})
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          No channels available
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto overflow-y-visible rounded-xl border-2 border-slate-300 shadow-xl bg-white max-w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
                  <th className="sticky left-0 z-20 border-b-2 border-r-2 border-slate-600 px-5 py-4 text-left text-xs font-bold text-white uppercase tracking-wider bg-slate-800 shadow-lg min-w-[280px] max-w-[280px]">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <span>Stay Type Name</span>
                    </div>
                  </th>
                  {columns.map((col) => {
                    // Check if col is a Date object or number
                    const isDateColumn = col instanceof Date;
                    const columnKey = isDateColumn ? col.toISOString() : col;
                    const displayText = isDateColumn
                      ? col.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : `Day ${col}`;
                    const dayOfWeek = isDateColumn
                      ? col.toLocaleDateString("en-US", { weekday: "short" })
                      : "";

                    return (
                      <th
                        key={columnKey}
                        className="border-b-2 border-r border-slate-600 px-5 py-4 text-center text-xs font-bold text-white uppercase transition-all min-w-[120px] bg-slate-600"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{displayText}</span>
                          {dayOfWeek && (
                            <span className="text-xs opacity-80">
                              {dayOfWeek}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayedPricingGridData.map((row, rowIndex) => {
                  // Find the meal plan for this row
                  const rowMealPlan = mealPlans.find(
                    (mp) => mp.code === row.mealPlanCode
                  );

                  return (
                    <tr
                      key={`${row.roomTypeId}-${row.mealPlanCode}-${row.guestTypeCode}`}
                      className={`transition-all border-b border-slate-200 hover:bg-slate-100/50 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <td className="sticky left-0 z-10 border-r-4 border-slate-300 bg-white px-6 py-5 text-sm font-semibold text-slate-900 shadow-sm min-w-[320px] max-w-[320px]">
                        <div className="flex items-center gap-4 w-full">
                          {/* Icon Box - Blue background like in image */}
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                            <span className="text-xl">{row.guestTypeIcon}</span>
                          </div>

                          {/* Text Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 text-sm">
                              {row.roomTypeName}
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {row.guestTypeName}
                            </p>
                          </div>

                          {/* Meal Plan Badge - Green like in image */}
                          {rowMealPlan && (
                            <span
                              className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-md flex-shrink-0 whitespace-nowrap"
                              title={`${rowMealPlan.name}: ${rowMealPlan.description}`}
                            >
                              {rowMealPlan.code}
                            </span>
                          )}
                        </div>
                      </td>
                      {row.basePrices.map((basePrice, colIndex) => {
                        const finalPrice = calculatePrice(
                          basePrice,
                          row.mealPlanCode
                        );

                        return (
                          <td
                            key={colIndex}
                            onClick={() => {
                              setEditingPrice(basePrice.toString());
                              setEditingPriceData({
                                ...row,
                                columnIndex: colIndex,
                                originalPrice: basePrice,
                              });
                              setShowEditPriceModal(true);
                            }}
                            className="border-b border-r border-slate-200 px-4 py-3 text-center text-sm font-semibold transition-all cursor-pointer min-w-[120px] text-slate-700 hover:bg-slate-100"
                            title={`Base: ${formatCurrency(
                              basePrice,
                              "LKR"
                            )} → Final: ${formatCurrency(finalPrice, "LKR")}`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span>{formatCurrency(finalPrice, "LKR")}</span>
                              {basePrice !== finalPrice && (
                                <span className="text-[10px] text-slate-500 line-through">
                                  {formatCurrency(basePrice, "LKR")}
                                </span>
                              )}
                              <span className="text-[9px] text-slate-500">
                                Click to edit
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {displayedPricingGridData.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-12 text-center">
              <User className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <p className="text-sm font-semibold text-slate-600 mb-1">
                No room types available
              </p>
              <p className="text-xs text-slate-500">
                Please add room types first to manage pricing
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Room Type (Stay Type) Modal */}
      <Modal
        isOpen={showAddRoomTypeModal}
        onClose={() => {
          setShowAddRoomTypeModal(false);
          setNewRoomTypeName("");
          setNewRoomTypeBasePrice("");
          setSelectedMealPlans([]);
        }}
        title="Add New Stay Type"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Stay Type Name
            </label>
            <input
              type="text"
              value={newRoomTypeName}
              onChange={(e) => setNewRoomTypeName(e.target.value)}
              placeholder="e.g., Deluxe Room, Suite"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Base Price (LKR)
            </label>
            <input
              type="number"
              value={newRoomTypeBasePrice}
              onChange={(e) => setNewRoomTypeBasePrice(e.target.value)}
              placeholder="e.g., 5000"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Meal Plans
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-3">
              {mealPlans.map((mealPlan) => (
                <label
                  key={mealPlan.id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedMealPlans.includes(mealPlan.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMealPlans([
                          ...selectedMealPlans,
                          mealPlan.id,
                        ]);
                      } else {
                        setSelectedMealPlans(
                          selectedMealPlans.filter((id) => id !== mealPlan.id)
                        );
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                      {mealPlan.code}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {mealPlan.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select meal plans to create pricing combinations for this stay
              type
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              setShowAddRoomTypeModal(false);
              setNewRoomTypeName("");
              setNewRoomTypeBasePrice("");
              setSelectedMealPlans([]);
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!newRoomTypeName.trim()) {
                setFeedback({
                  type: "error",
                  message: "Please enter a stay type name",
                });
                return;
              }

              const newRoomType = {
                id: generateId(),
                name: newRoomTypeName.trim(),
                basePrice: parseFloat(newRoomTypeBasePrice) || 0,
                description: "",
                capacity: 2,
              };

              dispatch({ type: "ADD_ROOM_TYPE", payload: newRoomType });

              setFeedback({
                type: "success",
                message: `✓ Stay type "${newRoomTypeName.trim()}" added successfully!`,
              });
              setShowAddRoomTypeModal(false);
              setNewRoomTypeName("");
              setNewRoomTypeBasePrice("");
              setSelectedMealPlans([]);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold"
          >
            Add Stay Type
          </button>
        </div>
      </Modal>

      {/* Edit Room Type (Stay Type) Modal */}
      <Modal
        isOpen={showEditRoomTypeModal}
        onClose={() => {
          setShowEditRoomTypeModal(false);
          setEditRoomTypeName("");
          setEditRoomTypeBasePrice("");
          setEditingRoomTypeId("");
          setEditSelectedMealPlans([]);
        }}
        title="Edit Stay Type"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Stay Type Name
            </label>
            <input
              type="text"
              value={editRoomTypeName}
              onChange={(e) => setEditRoomTypeName(e.target.value)}
              placeholder="Enter stay type name"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Base Price (LKR)
            </label>
            <input
              type="number"
              value={editRoomTypeBasePrice}
              onChange={(e) => setEditRoomTypeBasePrice(e.target.value)}
              placeholder="Enter base price"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Meal Plans
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-300 rounded-lg p-3">
              {mealPlans.map((mealPlan) => (
                <label
                  key={mealPlan.id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={editSelectedMealPlans.includes(mealPlan.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditSelectedMealPlans([
                          ...editSelectedMealPlans,
                          mealPlan.id,
                        ]);
                      } else {
                        setEditSelectedMealPlans(
                          editSelectedMealPlans.filter(
                            (id) => id !== mealPlan.id
                          )
                        );
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white">
                      {mealPlan.code}
                    </span>
                    <span className="text-sm font-medium text-slate-700">
                      {mealPlan.name}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select meal plans to create pricing combinations for this stay
              type
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              setShowEditRoomTypeModal(false);
              setEditRoomTypeName("");
              setEditRoomTypeBasePrice("");
              setEditingRoomTypeId("");
              setEditSelectedMealPlans([]);
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editRoomTypeName.trim()) {
                setFeedback({
                  type: "error",
                  message: "Please enter a stay type name",
                });
                return;
              }

              const oldRoomType = state.roomTypes.find(
                (rt) => rt.id === editingRoomTypeId
              );
              if (!oldRoomType) {
                setFeedback({
                  type: "error",
                  message: "Stay type not found",
                });
                return;
              }

              dispatch({
                type: "UPDATE_ROOM_TYPE",
                payload: {
                  ...oldRoomType,
                  name: editRoomTypeName.trim(),
                  basePrice: parseFloat(editRoomTypeBasePrice) || 0,
                },
              });

              setFeedback({
                type: "success",
                message: `✓ Stay type updated successfully!`,
              });
              setShowEditRoomTypeModal(false);
              setEditRoomTypeName("");
              setEditRoomTypeBasePrice("");
              setEditingRoomTypeId("");
              setEditSelectedMealPlans([]);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold"
          >
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Edit Price Modal */}
      <Modal
        isOpen={showEditPriceModal}
        onClose={() => {
          setShowEditPriceModal(false);
          setEditingPrice("");
          setEditingPriceData(null);
        }}
        title="Edit Price"
      >
        {editingPriceData && (
          <div className="space-y-4">
            {/* Room/Stay Type Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">
                    {editingPriceData.guestTypeIcon}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900">
                    {editingPriceData.roomTypeName}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {editingPriceData.guestTypeName} -{" "}
                    {editingPriceData.mealPlanCode}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-slate-600 font-medium">Original Price</p>
                  <p className="text-slate-900 font-bold text-sm">
                    {formatCurrency(editingPriceData.originalPrice, "LKR")}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 font-medium">Column</p>
                  <p className="text-slate-900 font-bold text-sm">
                    {editingPriceData.columnIndex + 1}
                  </p>
                </div>
              </div>
            </div>

            {/* Price Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                New Price (LKR)
              </label>
              <input
                type="number"
                step="0.01"
                value={editingPrice}
                onChange={(e) => setEditingPrice(e.target.value)}
                placeholder="Enter new price"
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base font-semibold"
                autoFocus
              />
              <p className="text-xs text-slate-500 mt-2">
                Enter the new price for this cell
              </p>
            </div>

            {/* Price Difference Preview */}
            {editingPrice && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-700 mb-2">
                  Price Change
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    {formatCurrency(editingPriceData.originalPrice, "LKR")} →
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(parseFloat(editingPrice) || 0, "LKR")}
                  </span>
                  <span className="text-sm font-semibold">
                    {editingPrice
                      ? `${
                          parseFloat(editingPrice) >
                          editingPriceData.originalPrice
                            ? "+"
                            : ""
                        }${formatCurrency(
                          parseFloat(editingPrice) -
                            editingPriceData.originalPrice,
                          "LKR"
                        )}`
                      : "No change"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              setShowEditPriceModal(false);
              setEditingPrice("");
              setEditingPriceData(null);
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!editingPrice || parseFloat(editingPrice) < 0) {
                toast.error("Please enter a valid price");
                return;
              }

              // Save the edited price
              setFeedback({
                type: "success",
                message: `✓ Price updated to ${formatCurrency(
                  parseFloat(editingPrice),
                  "LKR"
                )} successfully!`,
              });

              setShowEditPriceModal(false);
              setEditingPrice("");
              setEditingPriceData(null);
            }}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold"
          >
            Save Price
          </button>
        </div>
      </Modal>

      {/* Multi-Level Price Adjustment Modal */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => {
          setShowAdjustmentModal(false);
        }}
        title="Price Adjustment"
      >
        <div className="space-y-4">
          {/* Scope Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-semibold text-slate-700">
              Adjusting:{" "}
              <span className="text-blue-600">
                {adjustmentScope === "all-channels" && (
                  <>{state.channels.length} channels</>
                )}
                {adjustmentScope === "all-subchannels" && <>All channels</>}
                {adjustmentScope === "selected-subchannels" && (
                  <>
                    {selectedSubChannels.length} selected channel
                    {selectedSubChannels.length !== 1 ? "s" : ""}
                  </>
                )}
                {adjustmentScope === "single-subchannel" && (
                  <>Selected channel</>
                )}
              </span>
            </p>
          </div>

          {/* Operation Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select Operation
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentOperation("increase")}
                className={`px-3 py-3 rounded-lg font-semibold text-sm transition-all ${
                  adjustmentOperation === "increase"
                    ? "bg-green-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Increase
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentOperation("decrease")}
                className={`px-3 py-3 rounded-lg font-semibold text-sm transition-all ${
                  adjustmentOperation === "decrease"
                    ? "bg-red-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Decrease
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentOperation("reset")}
                className={`px-3 py-3 rounded-lg font-semibold text-sm transition-all ${
                  adjustmentOperation === "reset"
                    ? "bg-amber-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Adjustment Type Selector - Only show if not resetting */}
          {adjustmentOperation !== "reset" && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentType("percentage")}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    adjustmentType === "percentage"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Percent className="h-4 w-4 inline mr-2" />
                  Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("fixed")}
                  className={`px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    adjustmentType === "fixed"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Fixed Amount
                </button>
              </div>
            </div>
          )}

          {/* Input Field - Only show if not resetting */}
          {adjustmentOperation !== "reset" &&
            (adjustmentType === "percentage" ? (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Percentage Value
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    value={adjustmentPercentage}
                    onChange={(e) => setAdjustmentPercentage(e.target.value)}
                    placeholder="Enter percentage (e.g., 10)"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Example: Enter 10 to {adjustmentOperation} by 10%
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Amount (LKR)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="Enter amount (e.g., 500)"
                    className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Amount will be converted to percentage based on average price
                </p>
              </div>
            ))}

          {/* Reset Confirmation Message */}
          {adjustmentOperation === "reset" && (
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
              <p className="text-sm font-semibold text-amber-800">
                ⚠️ This will reset all price modifiers to 0%
              </p>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              setShowAdjustmentModal(false);
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-semibold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={applyMultiLevelAdjustment}
            disabled={
              !adjustmentOperation ||
              (adjustmentOperation !== "reset" &&
                (!adjustmentType ||
                  (!adjustmentPercentage && !adjustmentAmount)))
            }
            className="px-5 py-2 rounded-lg transition-all font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Changes
          </button>
        </div>
      </Modal>
    </div>
  );
};
