import React, { useState, useMemo } from "react";
import { useHotel } from "../../context/HotelContext";
import { formatCurrency, generateId } from "../../utils/formatters";
import { Modal } from "../../components/ui/Modal";
import {
  DollarSign,
  Info,
  User,
  Calendar,
  Percent,
  TrendingUp,
  RefreshCw,
  Check,
  Lock,
  Unlock,
  Plus,
  X,
} from "lucide-react";

type ChannelTab = "DIRECT" | "WEB" | "OTA" | "TA";
type PricingCurrency = "LKR" | "USD";

// Guest type definitions
const guestTypes = [
  { code: "AO", name: "Adult Only", icon: "👤" },
  { code: "AC", name: "Adult + Child", icon: "👨‍👧" },
];

export const ChannelPricingGrid: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [activeTab, setActiveTab] = useState<ChannelTab>("DIRECT");
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [showAddChannelModal, setShowAddChannelModal] =
    useState<boolean>(false);
  const [newChannelName, setNewChannelName] = useState<string>("");
  const [showAddChannelTypeModal, setShowAddChannelTypeModal] =
    useState<boolean>(false);
  const [newChannelTypeName, setNewChannelTypeName] = useState<string>("");
  const [showEditChannelModal, setShowEditChannelModal] =
    useState<boolean>(false);
  const [editingChannelId, setEditingChannelId] = useState<string>("");
  const [editChannelName, setEditChannelName] = useState<string>("");
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
  const [tabButtons, setTabButtons] = useState<
    Array<{ key: ChannelTab; label: string }>
  >([
    { key: "DIRECT", label: "DIRECT" },
    { key: "WEB", label: "WEB" },
    { key: "OTA", label: "OTA" },
    { key: "TA", label: "TA" },
  ]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const mealPlans =
    state.mealPlans && state.mealPlans.length > 0
      ? state.mealPlans
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
          {
            id: "mp-ro",
            name: "Room Only",
            code: "RO",
            description: "No meals",
            perPersonRate: 0,
            isActive: true,
          },
        ];
  // Top currency selection (radio). Renamed UI label to Currency.
  const [campingCurrency, setCampingCurrency] =
    useState<PricingCurrency>("LKR");
  const [percentage, setPercentage] = useState<string>("");
  const [typeValue, setTypeValue] = useState<string>("Percentage");
  const [amount, setAmount] = useState<string>("");
  const [hikeColumn, setHikeColumn] = useState<string>("");
  const [bottomCurrency, setBottomCurrency] = useState<PricingCurrency>("LKR");
  const [enterPercentage, setEnterPercentage] = useState<string>("");
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<null | {
    type: "error" | "success";
    message: string;
  }>(null);

  // Multi-level adjustment states
  const [adjustmentScope, setAdjustmentScope] = useState<
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

  const currencyCode = bottomCurrency === "LKR" ? "LKR" : "USD";

  // Generate columns 1-8
  const columns = Array.from({ length: 8 }, (_, i) => i + 1);

  // Build pricing grid data from room types combined with meal plans and guest types
  const pricingGridData = useMemo(() => {
    // Show all room type + meal plan + guest type combinations
    return state.roomTypes.flatMap((roomType) =>
      mealPlans.flatMap((mealPlan) =>
        guestTypes.map((guestType) => {
          const basePrice = roomType.basePrice || 0;
          const basePrices = columns.map((col) => {
            const variation = basePrice * (col * 0.02);
            return basePrice + variation;
          });

          return {
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            mealPlanCode: mealPlan.code,
            mealPlanName: mealPlan.name,
            guestTypeCode: guestType.code,
            guestTypeName: guestType.name,
            guestTypeIcon: guestType.icon,
            basePrices,
          };
        })
      )
    );
  }, [state.roomTypes, mealPlans, columns]);

  // Calculate final prices with meal plan adjustment and channel modifier
  const calculatePrice = (basePrice: number, mealPlanCode: string): number => {
    let working = basePrice;

    // Add meal plan perRoomRate (preferred) or perPersonRate based on the row's meal plan
    const mealPlan = mealPlans.find((mp) => mp.code === mealPlanCode);
    if (mealPlan) {
      const mealAddon = mealPlan.perRoomRate ?? mealPlan.perPersonRate ?? 0;
      working += mealAddon;
    }

    // Apply user-entered percentage or fixed amount adjustments (preview only)
    if (enterPercentage) {
      const pct = parseFloat(enterPercentage);
      if (!isNaN(pct)) {
        working = working * (1 + pct / 100);
      }
    } else if (percentage) {
      const pctPreset = parseFloat(percentage);
      if (!isNaN(pctPreset)) {
        working = working * (1 + pctPreset / 100);
      }
    }

    if (typeValue === "Amount" && amount) {
      const amt = parseFloat(amount);
      if (!isNaN(amt)) working += amt;
    }

    // Highlighted column hike could conceptually add a small premium (example: +2%)
    // This is illustrative; adjust logic if hike represents something else.
    if (hikeColumn) {
      // For demonstration, do not alter working yet; could integrate if required.
    }

    // Apply channel modifier last
    const channelData = selectedChannelId
      ? state.channels.find((ch) => ch.id === selectedChannelId)
      : state.channels.find((ch) => ch.name.toUpperCase().includes(activeTab));
    if (channelData && channelData.priceModifierPercent) {
      working = working * (1 + channelData.priceModifierPercent / 100);
    }

    return working;
  };

  const handleApply = () => {
    // Determine if there is any actionable change
    const hasChange = !!(enterPercentage || percentage || amount || hikeColumn);
    if (!hasChange) {
      setFeedback({
        type: "error",
        message: "Please select at least one pricing adjustment to apply.",
      });
      return;
    }

    // Simple validation of numeric custom percentage
    if (enterPercentage) {
      const valueNum = parseFloat(enterPercentage);
      if (isNaN(valueNum)) {
        setFeedback({
          type: "error",
          message: "Custom percentage must be a valid number.",
        });
        return;
      }
      if (valueNum < -100 || valueNum > 100) {
        setFeedback({
          type: "error",
          message: "Custom percentage must be between -100% and 100%.",
        });
        return;
      }
    }

    // Calculate preview impact
    let affectedCombos = displayedPricingGridData.length;
    let affectedColumns = hikeColumn ? 1 : columns.length;
    let totalCells = affectedCombos * affectedColumns;

    setFeedback({
      type: "success",
      message: `✓ Applied to ${totalCells} price ${
        totalCells === 1 ? "cell" : "cells"
      } across ${affectedCombos} ${
        affectedCombos === 1 ? "combination" : "combinations"
      } for ${activeTab} channel.`,
    });
    // TODO: Integrate persistence logic (context update / API call) here.
  };

  const handleCancel = () => {
    setPercentage("");
    setAmount("");
    setHikeColumn("");
    setEnterPercentage("");
    setSelectedDate("");
    setFeedback(null);
  };

  // Handle sub-channel selection toggle
  const toggleSubChannelSelection = (channelId: string) => {
    setSelectedSubChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  // Handle select all sub-channels
  const handleSelectAllSubChannels = () => {
    const allChannelIds = availableChannels.map((ch) => ch.id);
    setSelectedSubChannels(allChannelIds);
  };

  // Handle deselect all sub-channels
  const handleDeselectAllSubChannels = () => {
    setSelectedSubChannels([]);
  };

  // Open adjustment modal
  const openAdjustmentModal = (scope: typeof adjustmentScope) => {
    setAdjustmentScope(scope);
    setShowAdjustmentModal(true);
    setAdjustmentPercentage("");
    setAdjustmentAmount("");
    setAdjustmentType("percentage");
    setAdjustmentOperation("increase");
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
        affectedChannels = availableChannels.map((ch) => ch.id);
        scopeDescription = `all ${activeTab} sub-channels`;
        break;
      case "selected-subchannels":
        if (selectedSubChannels.length === 0) {
          setFeedback({
            type: "error",
            message: "Please select at least one sub-channel.",
          });
          return;
        }
        affectedChannels = selectedSubChannels;
        scopeDescription = `${selectedSubChannels.length} selected sub-channel${
          selectedSubChannels.length > 1 ? "s" : ""
        }`;
        break;
      case "single-subchannel":
        if (!selectedChannelId) {
          setFeedback({
            type: "error",
            message: "Please select a sub-channel first.",
          });
          return;
        }
        affectedChannels = [selectedChannelId];
        const channelName = state.channels.find(
          (ch) => ch.id === selectedChannelId
        )?.name;
        scopeDescription = `${channelName}`;
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
          : formatCurrency(value, currencyCode);
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

  const disableApply =
    !enterPercentage && !percentage && !amount && !hikeColumn;

  // Filter channels based on active tab
  const getChannelsForTab = (tab: ChannelTab) => {
    // First check if channel has tabKey property (for newly created channels)
    const channelsWithTabKey = state.channels.filter(
      (ch) => (ch as any).tabKey === tab
    );
    if (channelsWithTabKey.length > 0) {
      return channelsWithTabKey;
    }

    // Fallback to legacy type-based filtering for old data
    switch (tab) {
      case "DIRECT":
        return state.channels.filter(
          (ch) => ch.type === "Direct" || ch.type === "Walk-in"
        );
      case "WEB":
        return state.channels.filter((ch) => ch.type === "Direct");
      case "OTA":
        return state.channels.filter((ch) => ch.type === "OTA");
      case "TA":
        return state.channels.filter(
          (ch) => ch.type === "Agent" || ch.type === "Travel Agent"
        );
      default:
        // For custom tabs, filter by tabKey
        return state.channels.filter((ch) => (ch as any).tabKey === tab);
    }
  };

  const availableChannels = getChannelsForTab(activeTab);

  // Auto-select first channel when tab changes
  React.useEffect(() => {
    if (availableChannels.length > 0 && !selectedChannelId) {
      setSelectedChannelId(availableChannels[0].id);
    }
  }, [activeTab, availableChannels]);

  // Handler to add new channel
  const handleAddChannel = () => {
    if (!newChannelName.trim()) {
      alert("Please enter a channel name");
      return;
    }

    // Determine channel type based on active tab
    let channelType = "";
    switch (activeTab) {
      case "DIRECT":
        channelType = "Direct";
        break;
      case "WEB":
        channelType = "Direct";
        break;
      case "OTA":
        channelType = "OTA";
        break;
      case "TA":
        channelType = "Agent";
        break;
    }

    // Create new channel
    const newChannel = {
      id: generateId(),
      name: newChannelName,
      type: channelType,
      tabKey: activeTab,
      status: "active" as const,
      priceModifierPercent: 0,
    };

    // Dispatch to add channel
    dispatch({ type: "ADD_CHANNEL", payload: newChannel });

    // Reset and close modal
    setNewChannelName("");
    setShowAddChannelModal(false);
    setSelectedChannelId(newChannel.id);
  };

  // Use the full pricing grid data (no additional filtering needed)
  const displayedPricingGridData = pricingGridData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-amber-50/20 p-6 max-w-full overflow-hidden">
      {/* Modern Header */}
      <div className="bg-white via-slate-700 to-slate-800 rounded-2xl shadow-xl p-8 mb-6   max-w-full">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-slate-700">
                Channel Price Management
              </h1>
            </div>
            <p className="text-slate-300 text-base ml-14 text-slate-700">
              Dynamic pricing control with real-time updates across all booking
              channels
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Lock/Unlock Toggle */}
            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                isLocked
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-white text-slate-700 hover:bg-blue-50 border border-blue-200"
              }`}
              title={isLocked ? "Unlock for editing" : "Lock prices"}
            >
              {isLocked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              {isLocked ? "Locked" : "Unlocked"}
            </button>
          </div>
        </div>

        {/* Channel Tabs */}
        <div className="mt-6 flex items-center gap-4 border-t border-slate-600 pt-6">
          <div className="text-sm font-semibold text-slate-300 text-slate-700">
            Select Channel:
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            {tabButtons.map((tab, index) => (
              <div key={tab.key} className="relative group">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSelectedChannelId(""); // Reset channel selection when tab changes
                  }}
                  className={`relative px-8 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50"
                      : "bg-white text-slate-700 hover: border border-slate-600"
                  }`}
                >
                  {tab.label}
                </button>

                {/* Edit/Delete buttons for custom tabs (not default ones) */}
                {index >= 4 && (
                  <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt(
                          `Edit channel type name:`,
                          tab.label
                        );
                        if (newName && newName.trim()) {
                          const newKey = newName
                            .trim()
                            .toUpperCase()
                            .replace(/\s+/g, "_");
                          setTabButtons((prev) =>
                            prev.map((t) =>
                              t.key === tab.key
                                ? { key: newKey as ChannelTab, label: newKey }
                                : t
                            )
                          );
                          if (activeTab === tab.key) {
                            setActiveTab(newKey as ChannelTab);
                          }
                          setFeedback({
                            type: "success",
                            message: `✓ Channel type renamed to "${newKey}"`,
                          });
                        }
                      }}
                      className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                      title="Edit channel type"
                    >
                      <User className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `Delete "${tab.label}" channel type? All channels in this category will remain but need to be reassigned.`
                          )
                        ) {
                          setTabButtons((prev) =>
                            prev.filter((t) => t.key !== tab.key)
                          );
                          if (activeTab === tab.key) {
                            setActiveTab("DIRECT");
                          }
                          setFeedback({
                            type: "success",
                            message: `✓ Channel type "${tab.label}" deleted`,
                          });
                        }
                      }}
                      className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                      title="Delete channel type"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Add New Channel Type Button */}
            <button
              type="button"
              onClick={() => setShowAddChannelTypeModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:scale-105"
              title="Add a new channel type category"
            >
              <Plus className="h-4 w-4" />
              <span>Add Type</span>
            </button>
          </div>
        </div>

        {/* Channel Dropdown - Show available channels for selected tab */}
        <div className="mt-4 flex items-center gap-4">
          <div className="text-sm font-semibold text-slate-700">
            Select {activeTab} Channel:
          </div>
          <select
            value={selectedChannelId}
            onChange={(e) => setSelectedChannelId(e.target.value)}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl bg-white text-slate-700 border border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover: transition-all min-w-[250px]"
          >
            <option value="">All {activeTab} Channels</option>
            {availableChannels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.name}
                {channel.priceModifierPercent
                  ? ` (${channel.priceModifierPercent > 0 ? "+" : ""}${
                      channel.priceModifierPercent
                    }%)`
                  : ""}
              </option>
            ))}
          </select>

          {/* Add New Channel Button */}
          <button
            type="button"
            onClick={() => setShowAddChannelModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg"
            title={`Add new ${activeTab} channel`}
          >
            <Plus className="h-4 w-4" />
            Add Channel
          </button>

          {/* Edit Channel Button */}
          {selectedChannelId && (
            <button
              type="button"
              onClick={() => {
                const channel = availableChannels.find(
                  (ch) => ch.id === selectedChannelId
                );
                if (channel) {
                  setEditingChannelId(channel.id);
                  setEditChannelName(channel.name);
                  setShowEditChannelModal(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg"
              title="Edit selected channel"
            >
              <User className="h-4 w-4" />
              Edit
            </button>
          )}

          {/* Delete Channel Button */}
          {selectedChannelId && (
            <button
              type="button"
              onClick={() => {
                const channel = availableChannels.find(
                  (ch) => ch.id === selectedChannelId
                );
                if (
                  channel &&
                  confirm(
                    `Are you sure you want to delete "${channel.name}"? This action cannot be undone.`
                  )
                ) {
                  dispatch({ type: "DELETE_CHANNEL", payload: channel.id });
                  setSelectedChannelId("");
                  setFeedback({
                    type: "success",
                    message: `✓ Channel "${channel.name}" deleted successfully!`,
                  });
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg"
              title="Delete selected channel"
            >
              <X className="h-4 w-4" />
              Delete
            </button>
          )}

          {selectedChannelId && (
            <div className="text-xs text-slate-400 bg-white text-slate-700 px-3 py-2 rounded-lg border border-slate-600">
              <span className="font-semibold">
                {
                  availableChannels.find((ch) => ch.id === selectedChannelId)
                    ?.name
                }
              </span>{" "}
              pricing active
            </div>
          )}
        </div>

        {/* Multi-Level Price Adjustment Controls */}
        <div className="mt-6 border-t border-slate-600 pt-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold bg-white text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400 " />
              Price Adjustment Options
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* All Channels */}
              <button
                type="button"
                onClick={() => openAdjustmentModal("all-channels")}
                disabled={isLocked}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-purple-800 hover:from-white-700 hover:border border-purple-800 text-slate=700 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                <DollarSign className="h-5 w-5 text-purple-800" />
                <span className="text-center text-purple-800">
                  Adjust All Channels
                </span>
                <span className="text-xs opacity-80 text-purple-800">
                  {state.channels.length} channels
                </span>
              </button>

              {/* All Sub-channels in Current Type */}
              <button
                type="button"
                onClick={() => openAdjustmentModal("all-subchannels")}
                disabled={isLocked}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-blue-800 hover:from-white-700 hover:border border-blue-800 text-slate=700 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                <TrendingUp className="h-5 w-5 text-blue-800" />
                <span className="text-center text-blue-800">
                  Adjust All {activeTab}
                </span>
                <span className="text-xs opacity-80 text-blue-800">
                  {availableChannels.length} sub-channels
                </span>
              </button>

              {/* Selected Sub-channels */}
              <button
                type="button"
                onClick={() => openAdjustmentModal("selected-subchannels")}
                disabled={isLocked}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-amber-800 hover:from-white-700 hover:border border-blue-800 text-slate=700 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                <Check className="h-5 w-5 text-amber-800" />
                <span className="text-center text-amber-800">
                  Adjust Selected
                </span>
                <span className="text-xs opacity-80 text-amber-800">
                  {selectedSubChannels.length > 0
                    ? `${selectedSubChannels.length} selected`
                    : "None selected"}
                </span>
              </button>

              {/* Single Sub-channel */}
              <button
                type="button"
                onClick={() => openAdjustmentModal("single-subchannel")}
                disabled={isLocked || !selectedChannelId}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-emerald-800 hover:from-white-700 hover:border border-blue-800 text-slate=700 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                <User className="h-5 w-5 text-emerald-800" />
                <span className="text-center  text-emerald-800">
                  Adjust Single
                </span>
                <span className="text-xs opacity-80">
                  {selectedChannelId ? "Channel selected" : "Select channel"}
                </span>
              </button>
            </div>
          </div>

          {/* Sub-channel Selection Panel (for multi-select) */}
          {availableChannels.length > 0 && (
            <div className="mt-4  rounded-xl p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-300bg-white text-slate-700">
                  Select Sub-Channels for Batch Adjustment
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllSubChannels}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllSubChannels}
                    className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedSubChannels.length === 0) {
                        setFeedback({
                          type: "error",
                          message:
                            "Please select at least one sub-channel to reset.",
                        });
                        return;
                      }
                      selectedSubChannels.forEach((channelId) => {
                        const channel = state.channels.find(
                          (ch) => ch.id === channelId
                        );
                        if (channel) {
                          dispatch({
                            type: "UPDATE_CHANNEL",
                            payload: {
                              ...channel,
                              priceModifierPercent: 0,
                            },
                          });
                        }
                      });
                      setFeedback({
                        type: "success",
                        message: `✓ Successfully reset ${
                          selectedSubChannels.length
                        } selected channel${
                          selectedSubChannels.length > 1 ? "s" : ""
                        } to 0%`,
                      });
                      setSelectedSubChannels([]);
                    }}
                    className="text-xs px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableChannels.map((channel) => (
                  <label
                    key={channel.id}
                    className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all text-slate-700  border-2 ${
                      selectedSubChannels.includes(channel.id)
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-white border-slate-600 text-slate-700 hover:bg-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSubChannels.includes(channel.id)}
                      onChange={() => toggleSubChannelSelection(channel.id)}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">
                        {channel.name}
                      </div>
                      {channel.priceModifierPercent !== undefined &&
                        channel.priceModifierPercent !== 0 && (
                          <div className="text-[10px] opacity-75">
                            {channel.priceModifierPercent > 0 ? "+" : ""}
                            {channel.priceModifierPercent}%
                          </div>
                        )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-full overflow-hidden">
        {/* Reservation Type Section */}
        <div className="border-b border-slate-200 px-6 py-5 bg-gradient-to-r from-slate-50 to-stone-50">
          <div className="flex items-center gap-2 text-slate-700">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-base">Reservation Type</span>
          </div>
        </div>

        {/* Filter & Controls Panel */}
        <div className="p-6 bg-gradient-to-br from-slate-50/50 to-stone-50/50 border-b border-slate-200">
          <div className="space-y-4">
            {/* Header with Feedback */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800 tracking-wide flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span>Pricing Controls & Filters</span>
              </h3>
              {feedback && (
                <div
                  className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm ${
                    feedback.type === "error"
                      ? "bg-red-50 text-red-700 border-2 border-red-200"
                      : "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                  }`}
                >
                  <Info className="h-4 w-4" />
                  <span className="font-medium">{feedback.message}</span>
                  <button
                    type="button"
                    onClick={() => setFeedback(null)}
                    className="ml-2 text-sm font-bold hover:scale-110 transition-transform"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* First Row - Main Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Date Range - Start */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  From Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Start date"
                />
              </div>

              {/* Date Range - End */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="End date"
                />
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <DollarSign className="h-3.5 w-3.5 text-green-600" />
                  Display Currency
                </label>
                <div className="flex items-center gap-4 rounded-lg border-2 border-slate-300 bg-white px-4 py-2 shadow-sm">
                  <label className="flex cursor-pointer items-center gap-2 hover:opacity-80 transition-opacity">
                    <input
                      type="radio"
                      name="camping"
                      checked={campingCurrency === "LKR"}
                      onChange={() => setCampingCurrency("LKR")}
                      className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      LKR
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 hover:opacity-80 transition-opacity">
                    <input
                      type="radio"
                      name="camping"
                      checked={campingCurrency === "USD"}
                      onChange={() => setCampingCurrency("USD")}
                      className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      USD
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Second Row - View Options & Quick Actions */}
            <div className="flex items-center justify-between gap-4 py-3 border-t border-blue-100">
              {/* Comparison Toggle */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-slate-700">
                  View Options:
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showComparison}
                    onChange={(e) => setShowComparison(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                    Show Base Price Comparison
                  </span>
                </label>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  Quick Actions:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPercentage("10");
                      setTypeValue("Percentage");
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                  >
                    +10% Increase
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPercentage("-10");
                      setTypeValue("Percentage");
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    -10% Decrease
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPercentage("20");
                      setTypeValue("Percentage");
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                  >
                    +20% Peak
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAmount("500");
                      setTypeValue("Amount");
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                  >
                    +500 Fixed
                  </button>
                </div>
              </div>
            </div>

            {/* Third Row - Detailed Controls */}
            <div className="space-y-3 pt-3 border-t border-blue-100">
              <label className="text-xs font-semibold text-slate-700">
                Advanced Adjustments:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Percentage */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Percent className="h-3.5 w-3.5 text-purple-600" />
                    Preset %
                  </label>
                  <select
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select %</option>
                    <option value="5">+5%</option>
                    <option value="10">+10%</option>
                    <option value="15">+15%</option>
                    <option value="20">+20%</option>
                    <option value="-5">-5%</option>
                    <option value="-10">-10%</option>
                  </select>
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-700" />
                    Adjustment Type
                  </label>
                  <select
                    value={typeValue}
                    onChange={(e) => setTypeValue(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="Percentage">Percentage</option>
                    <option value="Amount">Fixed Amount</option>
                  </select>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <DollarSign className="h-3.5 w-3.5 text-green-600" />
                    Fixed Amount
                  </label>
                  <select
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select Amount</option>
                    <option value="100">+100</option>
                    <option value="500">+500</option>
                    <option value="1000">+1000</option>
                    <option value="2000">+2000</option>
                  </select>
                </div>

                {/* Hike */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <TrendingUp className="h-3.5 w-3.5 text-red-600" />
                    Target Column
                  </label>
                  <select
                    value={hikeColumn}
                    onChange={(e) => setHikeColumn(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">All Columns</option>
                    {columns.map((col) => (
                      <option key={col} value={col.toString()}>
                        Column {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Enter Percentage */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Percent className="h-3.5 w-3.5 text-indigo-600" />
                    Custom %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={enterPercentage}
                    onChange={(e) => setEnterPercentage(e.target.value)}
                    placeholder="Enter custom %"
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-blue-100">
              {/* Summary Info */}
              <div className="flex items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>
                    <strong>{displayedPricingGridData.length}</strong>{" "}
                    combinations
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>
                    <strong>{columns.length}</strong> columns
                  </span>
                </div>
                {hikeColumn && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                    <span>
                      Targeting <strong>Column {hikeColumn}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:border-gray-400 transition-all"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={disableApply}
                  className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold shadow-md transition-all ${
                    disableApply
                      ? "bg-gray-300 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-105"
                  }`}
                  title={
                    disableApply
                      ? "Select at least one pricing adjustment"
                      : "Apply pricing changes"
                  }
                >
                  <Check className="h-4 w-4" />
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Statistics Cards */}
        <div className="p-6 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-300 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Total Combinations
                </span>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <User className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-slate-900 mb-1">
                {displayedPricingGridData.length}
              </div>
              <div className="text-xs font-medium text-slate-600">
                Room + Meal + Guest combos
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-5 border border-emerald-300 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  Price Points
                </span>
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-emerald-900 mb-1">
                {displayedPricingGridData.length * columns.length}
              </div>
              <div className="text-xs font-medium text-emerald-600">
                Total cells in grid
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-300 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                  Avg Markup
                </span>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <Percent className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-blue-900 mb-1">
                {(() => {
                  const channelData = selectedChannelId
                    ? state.channels.find((ch) => ch.id === selectedChannelId)
                    : state.channels.find((ch) =>
                        ch.name.toUpperCase().includes(activeTab)
                      );
                  return channelData?.priceModifierPercent || 0;
                })()}
                %
              </div>
              <div className="text-xs font-medium text-blue-600">
                For{" "}
                {selectedChannelId
                  ? availableChannels.find((ch) => ch.id === selectedChannelId)
                      ?.name
                  : activeTab}{" "}
                channel
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-5 border border-indigo-300 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
                  Date Range
                </span>
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-900 mb-1">
                {selectedDate
                  ? new Date(selectedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Not set"}
              </div>
              <div className="text-xs text-indigo-600 mt-1">
                {endDate
                  ? `to ${new Date(endDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`
                  : "Single date"}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Grid Section */}
        <div className="p-6 overflow-hidden">
          {/* Channel Price Heading & Controls */}
          <div className="mb-5 flex items-center justify-between bg-gradient-to-r from-slate-50 to-stone-50 px-6 py-4 rounded-xl border border-slate-300 shadow-sm flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span>Pricing Grid</span>
              </h2>
              {isLocked && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold text-red-700 border-2 border-red-200">
                  <Lock className="h-3.5 w-3.5" />
                  Locked
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 border border-slate-300 shadow-sm">
                <label className="text-xs font-bold text-slate-700">
                  Currency:
                </label>
                <select
                  value={bottomCurrency}
                  onChange={(e) =>
                    setBottomCurrency(e.target.value as PricingCurrency)
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                >
                  <option value="LKR">🇱🇰 LKR</option>
                  <option value="USD">🇺🇸 USD</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl px-5 py-2.5 shadow-lg">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-bold">November 2025</span>
              </div>
            </div>
          </div>

          {/* Pricing Grid Table */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-700">
                Manage Stay Types:
              </span>
              <button
                type="button"
                onClick={() => setShowAddRoomTypeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold text-sm transition-all shadow-md"
                title="Add new stay type"
              >
                <Plus className="h-4 w-4" />
                Add Stay Type
              </button>
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
                  {columns.map((col) => (
                    <th
                      key={col}
                      className={`border-b-2 border-r border-slate-600 px-5 py-4 text-center text-xs font-bold text-white uppercase transition-all min-w-[120px] ${
                        hikeColumn && parseInt(hikeColumn) === col
                          ? "bg-blue-600 scale-105 shadow-lg"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>Day {col}</span>
                        {hikeColumn && parseInt(hikeColumn) === col && (
                          <TrendingUp className="h-3 w-3" />
                        )}
                      </div>
                    </th>
                  ))}
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
                      className={`transition-all hover:bg-blue-50/30 ${
                        rowIndex % 2 === 0 ? "bg-slate-50/30" : "bg-white"
                      }`}
                    >
                      <td className="sticky left-0 z-10 border-b-2 border-r-2 border-slate-300 bg-gradient-to-r from-slate-100 via-stone-50 to-slate-50 px-5 py-4 text-sm font-bold text-slate-900 shadow-md min-w-[280px] max-w-[280px]">
                        <div className="flex items-center gap-3 group">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-base">
                              {row.guestTypeIcon}
                            </span>
                          </div>
                          <div className="flex flex-col flex-1">
                            <span className="font-bold text-slate-900">
                              {row.roomTypeName}
                            </span>
                            <span className="text-xs text-slate-600">
                              {row.guestTypeName}
                            </span>
                          </div>
                          {rowMealPlan && (
                            <span
                              className="ml-auto inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-md"
                              title={`${rowMealPlan.name}: ${rowMealPlan.description}`}
                            >
                              {rowMealPlan.code}
                            </span>
                          )}
                          {/* Edit/Delete buttons - only show for first guest type of each room type */}
                          {row.guestTypeCode === "AO" &&
                            row.mealPlanCode === mealPlans[0]?.code && (
                              <div className="hidden group-hover:flex gap-1 ml-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const roomType = state.roomTypes.find(
                                      (rt) => rt.id === row.roomTypeId
                                    );
                                    if (roomType) {
                                      setEditingRoomTypeId(roomType.id);
                                      setEditRoomTypeName(roomType.name);
                                      setEditRoomTypeBasePrice(
                                        roomType.basePrice?.toString() || "0"
                                      );
                                      // Set all meal plans as selected by default for editing
                                      setEditSelectedMealPlans(
                                        mealPlans.map((mp) => mp.id)
                                      );
                                      setShowEditRoomTypeModal(true);
                                    }
                                  }}
                                  className="w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md transition-all"
                                  title="Edit stay type"
                                >
                                  <User className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const roomType = state.roomTypes.find(
                                      (rt) => rt.id === row.roomTypeId
                                    );
                                    if (
                                      roomType &&
                                      confirm(
                                        `Delete "${roomType.name}"? This will remove all pricing data for this stay type.`
                                      )
                                    ) {
                                      dispatch({
                                        type: "DELETE_ROOM_TYPE",
                                        payload: roomType.id,
                                      });
                                      setFeedback({
                                        type: "success",
                                        message: `✓ Stay type "${roomType.name}" deleted successfully!`,
                                      });
                                    }
                                  }}
                                  className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-md transition-all"
                                  title="Delete stay type"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                        </div>
                      </td>
                      {row.basePrices.map((basePrice, colIndex) => {
                        const finalPrice = calculatePrice(
                          basePrice,
                          row.mealPlanCode
                        );
                        const cellKey = `${row.roomTypeId}-${row.guestTypeCode}-${colIndex}`;
                        const isHovered = hoveredCell === cellKey;
                        const isSelectedColumn =
                          hikeColumn && parseInt(hikeColumn) === colIndex + 1;

                        return (
                          <td
                            key={colIndex}
                            onMouseEnter={() => setHoveredCell(cellKey)}
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`border-b border-r border-slate-200 px-4 py-3 text-center text-sm font-semibold transition-all cursor-pointer relative group min-w-[120px] ${
                              isSelectedColumn
                                ? "bg-blue-200 ring-2 ring-inset ring-blue-500 text-blue-900 shadow-inner"
                                : isHovered
                                ? "bg-blue-100 text-blue-800 scale-105 shadow-md z-10"
                                : "text-slate-700 hover:shadow-sm"
                            }`}
                            title={`Base: ${formatCurrency(
                              basePrice,
                              currencyCode
                            )} → Final: ${formatCurrency(
                              finalPrice,
                              currencyCode
                            )}`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`${
                                  isSelectedColumn || isHovered
                                    ? "font-bold text-base"
                                    : ""
                                }`}
                              >
                                {formatCurrency(finalPrice, currencyCode)}
                              </span>
                              {(isSelectedColumn || isHovered) &&
                                basePrice !== finalPrice && (
                                  <span className="text-[10px] text-slate-500 line-through">
                                    {formatCurrency(basePrice, currencyCode)}
                                  </span>
                                )}
                              {isHovered && (
                                <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[9px] text-blue-600 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                  Click to edit
                                </span>
                              )}
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

      {/* Add Channel Type Modal */}
      <Modal
        isOpen={showAddChannelTypeModal}
        onClose={() => {
          setShowAddChannelTypeModal(false);
          setNewChannelTypeName("");
        }}
        title="Add Channel Type"
      >
        <div className="space-y-4">
          {/* Compact Info */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plus className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs text-purple-800">
              Create a new category tab (e.g., CORPORATE, WHOLESALE)
            </p>
          </div>

          {/* Input with Preview */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Type Name
            </label>
            <input
              type="text"
              value={newChannelTypeName}
              onChange={(e) => setNewChannelTypeName(e.target.value)}
              placeholder="e.g., Corporate or Wholesale"
              className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-sm"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  document.getElementById("add-type-btn")?.click();
                }
              }}
            />
            {newChannelTypeName.trim() && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-slate-600">Will create:</span>
                <span className="inline-flex px-3 py-1 bg-purple-600 text-white rounded-md text-xs font-bold">
                  {newChannelTypeName.trim().toUpperCase().replace(/\s+/g, "_")}
                </span>
              </div>
            )}
          </div>

          {/* Quick Options */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Quick Select:
            </p>
            <div className="flex flex-wrap gap-2">
              {["CORPORATE", "WHOLESALE", "GDS", "AFFILIATE"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setNewChannelTypeName(type)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-700 hover:border-purple-400 hover:bg-purple-50 transition-all font-medium"
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              setShowAddChannelTypeModal(false);
              setNewChannelTypeName("");
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            id="add-type-btn"
            type="button"
            onClick={() => {
              if (!newChannelTypeName.trim()) {
                setFeedback({
                  type: "error",
                  message: "Please enter a channel type name",
                });
                return;
              }

              const typeKey = newChannelTypeName
                .trim()
                .toUpperCase()
                .replace(/\s+/g, "_");

              // Check if type already exists
              if (tabButtons.find((t) => t.key === typeKey)) {
                setFeedback({
                  type: "error",
                  message: `Channel type "${typeKey}" already exists!`,
                });
                return;
              }

              // Add new tab button
              setTabButtons((prev) => [
                ...prev,
                {
                  key: typeKey as ChannelTab,
                  label: typeKey,
                },
              ]);
              setActiveTab(typeKey as ChannelTab);
              setFeedback({
                type: "success",
                message: `✓ Channel type "${typeKey}" added successfully!`,
              });
              setShowAddChannelTypeModal(false);
              setNewChannelTypeName("");
            }}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-semibold"
          >
            Add Type
          </button>
        </div>
      </Modal>

      {/* Edit Channel Modal */}
      <Modal
        isOpen={showEditChannelModal}
        onClose={() => {
          setShowEditChannelModal(false);
          setEditChannelName("");
          setEditingChannelId("");
        }}
        title="Edit Channel"
      >
        <div className="space-y-4">
          {/* Compact Info */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs text-blue-800">
              Update the channel name for better organization
            </p>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Channel Name
            </label>
            <input
              type="text"
              value={editChannelName}
              onChange={(e) => setEditChannelName(e.target.value)}
              placeholder="Enter channel name"
              className="w-full px-4 py-2.5 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  document.getElementById("save-edit-btn")?.click();
                }
              }}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
          <button
            type="button"
            onClick={() => {
              setShowEditChannelModal(false);
              setEditChannelName("");
              setEditingChannelId("");
            }}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            id="save-edit-btn"
            type="button"
            onClick={() => {
              if (!editChannelName.trim()) {
                setFeedback({
                  type: "error",
                  message: "Please enter a channel name",
                });
                return;
              }

              const oldChannel = availableChannels.find(
                (ch) => ch.id === editingChannelId
              );

              if (!oldChannel) {
                setFeedback({
                  type: "error",
                  message: "Channel not found",
                });
                return;
              }

              dispatch({
                type: "UPDATE_CHANNEL",
                payload: {
                  ...oldChannel,
                  name: editChannelName.trim(),
                },
              });

              setFeedback({
                type: "success",
                message: `✓ Channel renamed from "${
                  oldChannel.name
                }" to "${editChannelName.trim()}"`,
              });
              setShowEditChannelModal(false);
              setEditChannelName("");
              setEditingChannelId("");
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold"
          >
            Save Changes
          </button>
        </div>
      </Modal>

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
              Base Price ({currencyCode})
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
              Base Price ({currencyCode})
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

      {/* Add Channel Modal */}
      <Modal
        isOpen={showAddChannelModal}
        onClose={() => {
          setShowAddChannelModal(false);
          setNewChannelName("");
        }}
        title="Add New Channel"
      >
        <div className="space-y-5">
          {/* Channel Type Badge */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-lg">
              <DollarSign className="h-5 w-5" />
              <span className="font-bold text-sm">{activeTab} Channel</span>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                <Info className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-blue-900 text-sm mb-1">
                  {activeTab === "OTA"
                    ? "Online Travel Agency"
                    : activeTab === "TA"
                    ? "Travel Agent Channel"
                    : activeTab === "WEB"
                    ? "Web Direct Channel"
                    : "Direct Booking Channel"}
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Create a new {activeTab.toLowerCase()} channel to manage
                  pricing and availability separately.
                </p>
              </div>
            </div>
          </div>

          {/* Input Field */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Channel Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder={`e.g., ${
                  activeTab === "OTA"
                    ? "Booking.com, Expedia, Airbnb"
                    : activeTab === "TA"
                    ? "ABC Travel Agency"
                    : activeTab === "WEB"
                    ? "Company Website"
                    : "Walk-in, Phone Booking"
                }`}
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base"
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Enter a unique, descriptive name for this channel
            </p>
          </div>

          {/* Quick Examples */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              💡 Example Names:
            </p>
            <div className="flex flex-wrap gap-2">
              {activeTab === "OTA" ? (
                <>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-600">
                    Booking.com
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-600">
                    Expedia
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-600">
                    Airbnb
                  </span>
                </>
              ) : activeTab === "TA" ? (
                <>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-600">
                    Travel Corp Ltd
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-600">
                    Agent Network
                  </span>
                </>
              ) : activeTab === "WEB" ? (
                <>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-600">
                    Main Website
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-600">
                    Mobile App
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-600">
                    Walk-in
                  </span>
                  <span className="text-xs bg-white px-2 py-1 rounded border border-slate-300 text-slate-600">
                    Phone Reservations
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => {
              setShowAddChannelModal(false);
              setNewChannelName("");
            }}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all font-semibold text-sm"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAddChannel}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md font-semibold"
          >
            <Check className="h-4 w-4" />
            Add Channel
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
                {adjustmentScope === "all-subchannels" && (
                  <>
                    {availableChannels.length} {activeTab} channels
                  </>
                )}
                {adjustmentScope === "selected-subchannels" && (
                  <>
                    {selectedSubChannels.length} selected channel
                    {selectedSubChannels.length !== 1 ? "s" : ""}
                  </>
                )}
                {adjustmentScope === "single-subchannel" &&
                  selectedChannelId && (
                    <>
                      {
                        state.channels.find((ch) => ch.id === selectedChannelId)
                          ?.name
                      }
                    </>
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
                  Amount ({currencyCode})
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
