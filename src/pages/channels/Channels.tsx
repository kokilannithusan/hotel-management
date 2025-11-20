import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { generateId } from "../../utils/formatters";
import type { Channel, ChannelStatus } from "../../types/entities";
import { Edit, Trash2, Plus, X, Check, CheckCircle2 } from "lucide-react";
import type { CustomReservationType } from "./ReservationTypeManager";

type ReservationType = "DIRECT" | "WEB" | "OTA" | "TA";

interface ChannelsProps {
  customTypes?: CustomReservationType[];
}

export const Channels: React.FC<ChannelsProps> = ({ customTypes = [] }) => {
  const { state, dispatch } = useHotel();

  // State for modals and tabs
  const [activeTab, setActiveTab] = useState<string>("DIRECT");
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");

  // Channel form data
  const [channelFormData, setChannelFormData] = useState<{
    name: string;
    status: ChannelStatus;
    reservationType: string;
  }>({
    name: "",
    status: "active",
    reservationType: "DIRECT",
  });

  const defaultReservationTypes: ReservationType[] = [
    "DIRECT",
    "WEB",
    "OTA",
    "TA",
  ];

  const getChannelsForType = (type: string): Channel[] => {
    return state.channels.filter(
      (ch) =>
        (ch as any).reservationType === type && !(ch as any).parentChannelId
    );
  };

  const availableChannels = getChannelsForType(activeTab);

  // Channel CRUD operations
  const handleAddChannel = () => {
    setEditingChannel(null);
    setChannelFormData({
      name: "",
      status: "active",
      reservationType: activeTab,
    });
    setShowChannelModal(true);
  };

  const handleEditChannel = (channel: Channel) => {
    setEditingChannel(channel);
    setChannelFormData({
      name: channel.name,
      status: channel.status,
      reservationType: (channel as any).reservationType || activeTab,
    });
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
          reservationType: channelFormData.reservationType,
        } as any,
      });
    } else {
      dispatch({
        type: "ADD_CHANNEL",
        payload: {
          id: generateId(),
          name: channelFormData.name,
          type: channelFormData.reservationType,
          status: channelFormData.status,
          reservationType: channelFormData.reservationType,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-amber-50/20 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 backdrop-blur-sm p-3 rounded-xl shadow-lg">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              Reservation Types & Channels
            </h1>
            <p className="text-slate-600 mt-1 font-medium text-sm">
              Manage booking channels for each reservation type
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-full overflow-hidden">
        {/* Reservation Type Tabs Section */}
        <div className="p-8 border-b border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-sm font-semibold text-slate-700 mb-4">
            Select Reservation Type:
          </div>
          <div className="flex gap-3 flex-wrap">
            {/* Default Types */}
            {defaultReservationTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setActiveTab(type);
                  setSelectedChannelId("");
                }}
                className={`relative px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                  activeTab === type
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105"
                    : "bg-white text-slate-700 border-2 border-slate-300 hover:border-blue-400 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === type && <CheckCircle2 className="w-4 h-4" />}
                  {type}
                </div>
              </button>
            ))}

            {/* Custom Types */}
            {customTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  setActiveTab(type.code);
                  setSelectedChannelId("");
                }}
                className={`relative px-6 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                  activeTab === type.code
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105"
                    : "bg-white text-slate-700 border-2 border-slate-300 hover:border-blue-400 hover:shadow-md"
                }`}
              >
                <div className="flex items-center gap-2">
                  {activeTab === type.code && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {type.code}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Type Banner */}
        <div className="px-8 pt-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-white" />
              <div>
                <p className="text-xs font-semibold text-blue-100 uppercase tracking-wide">
                  Currently Viewing
                </p>
                <h3 className="text-2xl font-bold text-white">
                  {activeTab} Reservation Type
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Channels Grid Section */}
        <div className="p-8 pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {activeTab} Channels
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {availableChannels.length} channel
                {availableChannels.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <Button
              onClick={() => handleAddChannel()}
              className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Channel
            </Button>
          </div>

          {availableChannels.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-slate-50 border-2 border-dashed border-slate-300">
              <Plus className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No channels yet</p>
              <p className="text-sm text-slate-500 mt-1">
                Add your first channel to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Channel Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {availableChannels.map((channel) => (
                    <tr
                      key={channel.id}
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={`transition-all cursor-pointer ${
                        selectedChannelId === channel.id
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {channel.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-600 font-medium">
                          {activeTab}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            channel.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {channel.status === "active"
                            ? "✓ Active"
                            : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditChannel(channel);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm transition-all"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChannel(channel);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Channel Modal */}
      <Modal
        isOpen={showChannelModal}
        onClose={() => setShowChannelModal(false)}
        title={editingChannel ? "Edit Channel" : "Add Channel"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reservation Type
            </label>
            <select
              value={channelFormData.reservationType}
              onChange={(e) =>
                setChannelFormData({
                  ...channelFormData,
                  reservationType: e.target.value,
                })
              }
              className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-slate-700 bg-white transition-all"
            >
              {defaultReservationTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
              {customTypes.map((type) => (
                <option key={type.id} value={type.code}>
                  {type.code}
                </option>
              ))}
            </select>
          </div>
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
