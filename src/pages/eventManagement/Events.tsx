import React, { useState } from "react";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useEventManagement } from "../../context/EventManagementContext";
import { useHotel } from "../../context/HotelContext";
import {
  EventMaster,
  EventTimeOfDay,
  EventStatus,
  EventFilters,
} from "../../types/eventManagement";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";

export const Events: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useEventManagement();
  const { state } = useHotel();
  const activeTaxes = state.taxes.filter((tax) => tax.isActive);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventMaster | null>(null);
  const [filters, setFilters] = useState<EventFilters>({
    search: "",
    eventType: "",
    timeOfDay: "",
    status: "",
  });

  const [formData, setFormData] = useState({
    eventName: "",
    eventType: "",
    timeOfDay: "Morning" as EventTimeOfDay,
    taxIds: [] as string[],
    description: "",
    status: "Active" as EventStatus,
  });
  const [customEventType, setCustomEventType] = useState("");
  const [showCustomEventType, setShowCustomEventType] = useState(false);

  const eventTypes = [
    "Wedding",
    "Conference",
    "Birthday Party",
    "Corporate Event",
    "Anniversary",
    "Seminar",
    "Workshop",
    "Others",
  ];
  const timeOfDayOptions: EventTimeOfDay[] = [
    "Morning",
    "Afternoon",
    "Evening",
    "Full Day",
  ];

  const handleOpenModal = (event?: EventMaster) => {
    if (event) {
      setEditingEvent(event);
      const isCustomType = !eventTypes.slice(0, -1).includes(event.eventType);
      setShowCustomEventType(isCustomType);
      setFormData({
        eventName: event.eventName,
        eventType: isCustomType ? "Others" : event.eventType,
        timeOfDay: event.timeOfDay,
        taxIds: event.taxIds || [],
        description: event.description || "",
        status: event.status,
      });
      setCustomEventType(isCustomType ? event.eventType : "");
    } else {
      setEditingEvent(null);
      setShowCustomEventType(false);
      setCustomEventType("");
      setFormData({
        eventName: "",
        eventType: "",
        timeOfDay: "Morning",
        taxIds: [],
        description: "",
        status: "Active",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      eventType:
        formData.eventType === "Others" ? customEventType : formData.eventType,
    };
    if (editingEvent) {
      updateEvent(editingEvent.id, submitData);
    } else {
      addEvent(submitData);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteEvent(id);
    }
  };

  const handleToggleStatus = (event: EventMaster) => {
    updateEvent(event.id, {
      status: event.status === "Active" ? "Inactive" : "Active",
    });
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.eventName.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.eventType.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType =
      !filters.eventType || event.eventType === filters.eventType;
    const matchesTimeOfDay =
      !filters.timeOfDay || event.timeOfDay === filters.timeOfDay;
    const matchesStatus = !filters.status || event.status === filters.status;
    return matchesSearch && matchesType && matchesTimeOfDay && matchesStatus;
  });

  const getTimeOfDayColor = (timeOfDay: EventTimeOfDay): string => {
    switch (timeOfDay) {
      case "Morning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "Afternoon":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "Evening":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "Full Day":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
          <p className="text-gray-600 mt-1">
            Manage event types and configurations
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-10"
            />
          </div>
          <select
            value={filters.eventType}
            onChange={(e) =>
              setFilters({ ...filters, eventType: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Event Types</option>
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={filters.timeOfDay}
            onChange={(e) =>
              setFilters({
                ...filters,
                timeOfDay: e.target.value as EventTimeOfDay | "",
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Time Slots</option>
            {timeOfDayOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as EventStatus | "",
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Events List */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time of Day
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No events found. Create your first event to get started.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {event.eventName}
                      </div>
                      {event.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {event.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.eventType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getTimeOfDayColor(
                          event.timeOfDay
                        )}`}
                      >
                        {event.timeOfDay}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(event)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          event.status === "Active"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {event.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleOpenModal(event)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingEvent ? "Edit Event" : "Add New Event"}
        size="4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              value={formData.eventName}
              onChange={(e) =>
                setFormData({ ...formData, eventName: e.target.value })
              }
              placeholder="Enter event name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Event Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {eventTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, eventType: type });
                    setShowCustomEventType(type === "Others");
                    if (type !== "Others") setCustomEventType("");
                  }}
                  className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                    formData.eventType === type
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {showCustomEventType && (
              <div className="mt-3">
                <Input
                  type="text"
                  required
                  value={customEventType}
                  onChange={(e) => setCustomEventType(e.target.value)}
                  placeholder="Enter custom event type"
                  className="w-full"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Time of Day <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeOfDayOptions.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      timeOfDay: time,
                    })
                  }
                  className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                    formData.timeOfDay === time
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tax <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-2 font-normal">
                (Select one or more)
              </span>
            </label>
            {activeTaxes.length === 0 ? (
              <p className="text-sm text-gray-500 py-3">
                No active taxes available. Please add taxes in settings.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {activeTaxes.map((tax) => {
                  const isSelected = formData.taxIds.includes(tax.id);
                  return (
                    <button
                      key={tax.id}
                      type="button"
                      onClick={() => {
                        const newTaxIds = isSelected
                          ? formData.taxIds.filter((id) => id !== tax.id)
                          : [...formData.taxIds, tax.id];
                        setFormData({
                          ...formData,
                          taxIds: newTaxIds,
                        });
                      }}
                      className={`px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                        isSelected
                          ? "bg-green-600 text-white border-green-600 shadow-md"
                          : "bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50"
                      }`}
                    >
                      <div className="font-semibold">{tax.name}</div>
                      <div className="text-xs mt-1">{tax.rate}%</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter event description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as EventStatus,
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              onClick={() => setShowModal(false)}
              className="bg-gray-500"
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingEvent ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
