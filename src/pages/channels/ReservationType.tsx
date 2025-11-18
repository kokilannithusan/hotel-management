import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { generateId } from "../../utils/formatters";
import type { Channel, ChannelStatus } from "../../types/entities";
import { Edit, Trash2, Plus, X, Check, RefreshCw } from "lucide-react";

type ReservationType = "DIRECT" | "WEB" | "OTA" | "TA";

export const ReservationType: React.FC = () => {
  const { state, dispatch } = useHotel();

  // State for modals and tabs
  const [activeTab, setActiveTab] = useState<ReservationType>("DIRECT");
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [selectedSubChannels, setSelectedSubChannels] = useState<string[]>([]);

  // Channel form data
  const [channelFormData, setChannelFormData] = useState<{
    name: string;
    status: ChannelStatus;
  }>({
    name: "",
    status: "active",
  });

  const reservationTypes: ReservationType[] = ["DIRECT", "WEB", "OTA", "TA"];

  const getChannelsForType = (type: ReservationType): Channel[] => {
    return state.channels.filter(
      (ch) =>
        (ch as any).reservationType === type && !(ch as any).parentChannelId
    );
  };

  const availableChannels = getChannelsForType(activeTab);

  // Toggle sub-channel selection
  const toggleSubChannelSelection = (channelId: string) => {
    setSelectedSubChannels((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId]
    );
  };

  // Select all channels
  const handleSelectAllChannels = () => {
    setSelectedSubChannels(availableChannels.map((ch) => ch.id));
  };

  // Deselect all channels
  const handleDeselectAllChannels = () => {
    setSelectedSubChannels([]);
  };

  // Channel CRUD operations
  const handleAddChannel = () => {
    setEditingChannel(null);
    setChannelFormData({ name: "", status: "active" });
    setShowChannelModal(true);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setChannelFormData({ name: channel.name, status: channel.status });
    setShowChannelModal(true);
  };

  const handleSaveChannel = () => {
    if (!channelFormData.name.trim()) {
      alert("Channel name is required");
      return;
    }

    if (editingChannel) {
      dispatch({
        type: "UPDATE_CHANNEL",
        payload: {
          ...editingChannel,
          name: channelFormData.name,
          status: channelFormData.status,
        },
      });
    } else {
      dispatch({
        type: "ADD_CHANNEL",
        payload: {
          id: generateId(),
          name: channelFormData.name,
          type: activeTab,
          status: channelFormData.status,
          reservationType: activeTab,
        } as any,
      });
    }
    setShowChannelModal(false);
  };

  const handleDeleteChannel = (channel: Channel) => {
    if (window.confirm(`Are you sure you want to delete "${channel.name}"?`)) {
      dispatch({ type: "DELETE_CHANNEL", payload: channel.id });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Reservation Types & Channels
          </h1>
          <p className="text-slate-600 mt-1 font-medium">
            Manage booking channels for each reservation type
          </p>
        </div>
      </div>

      {/* Header Section with Tab Buttons */}
      <Card className="p-6 bg-white">
        {/* Tab Buttons */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-slate-700 mb-3">
            Select Channel:
          </div>
          <div className="flex gap-3 flex-wrap">
            {reservationTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setActiveTab(type);
                  setSelectedChannelId("");
                }}
                className={`relative px-6 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${
                  activeTab === type
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50"
                    : "bg-white text-slate-700 border-2 border-slate-600 hover:border-blue-400"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <Button
            size="sm"
            onClick={() => handleAddChannel()}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Channel
          </Button>

          {selectedChannelId && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const channel = availableChannels.find(
                    (ch) => ch.id === selectedChannelId
                  );
                  if (channel) handleEditChannel(channel);
                }}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  const channel = availableChannels.find(
                    (ch) => ch.id === selectedChannelId
                  );
                  if (channel) handleDeleteChannel(channel);
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </>
          )}

          {selectedChannelId && (
            <div className="text-xs text-slate-600 bg-slate-100 px-3 py-2 rounded-lg border border-slate-300 ml-auto">
              <span className="font-semibold">
                {
                  availableChannels.find((ch) => ch.id === selectedChannelId)
                    ?.name
                }
              </span>
              {" pricing active"}
            </div>
          )}
        </div>

        {/* Sub-Channels Selection Panel */}
        {availableChannels.length > 0 && (
          <div className="rounded-xl p-4 border-2 border-slate-300 bg-slate-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-700">
                Select Sub-Channels for Batch Adjustment
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllChannels}
                  className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllChannels}
                  className="text-xs px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
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
                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2 ${
                    selectedSubChannels.includes(channel.id)
                      ? "bg-blue-100 border-blue-500"
                      : "bg-white border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubChannels.includes(channel.id)}
                    onChange={() => toggleSubChannelSelection(channel.id)}
                    className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {channel.name}
                    </div>
                    {channel.status === "active" && (
                      <div className="text-[10px] text-slate-600">
                        {channel.status}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Channel Modal */}
      <Modal
        isOpen={showChannelModal}
        onClose={() => setShowChannelModal(false)}
        title={editingChannel ? "Edit Channel" : "Add Channel"}
      >
        <div className="space-y-4">
          <Input
            label="Channel Name"
            value={channelFormData.name}
            onChange={(e) =>
              setChannelFormData({ ...channelFormData, name: e.target.value })
            }
            placeholder="e.g., Booking.com, Expedia"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status
            </label>
            <select
              value={channelFormData.status}
              onChange={(e) =>
                setChannelFormData({
                  ...channelFormData,
                  status: e.target.value as ChannelStatus,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={() => setShowChannelModal(false)}
          >
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button onClick={handleSaveChannel}>
            <Check className="w-4 h-4" /> Save
          </Button>
        </div>
      </Modal>
    </div>
  );
};
