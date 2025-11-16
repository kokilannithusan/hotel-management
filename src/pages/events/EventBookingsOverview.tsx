import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Users,
  MapPin,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Download,
  Plus,
  Clock,
  CalendarDays,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useHotel } from "../../context/HotelContext";
import { Event, EventStatus, EventType } from "../../types/entities";

interface EventBookingsOverviewProps {}

export const EventBookingsOverview: React.FC<
  EventBookingsOverviewProps
> = () => {
  const { state, updateEvent, deleteEvent } = useHotel();

  // Early return if state is not loaded
  if (!state) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    );
  }

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<EventStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month"
  >("all");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Event>>({});
  const [viewType, setViewType] = useState<"list" | "calendar">("list");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState<
    "month" | "year" | "date"
  >("month");

  // Get events from state
  const allEvents = state?.events || [];
  const allHalls = state?.halls || [];

  // Filter and search events
  const filteredEvents = useMemo(() => {
    if (!Array.isArray(allEvents)) {
      return [];
    }

    return allEvents.filter((event) => {
      // Add safety checks for event properties
      if (!event || typeof event !== "object") {
        return false;
      }

      const eventName = event.name || "";
      const organizerName = event.organizerName || "";
      const organizerEmail = event.organizerEmail || "";

      const matchesSearch =
        eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        organizerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        organizerEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;
      const matchesType = typeFilter === "all" || event.type === typeFilter;

      let matchesDate = true;
      if (dateFilter !== "all") {
        const eventDate = new Date(event.startDateTime);
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        switch (dateFilter) {
          case "today":
            const eventDay = new Date(
              eventDate.getFullYear(),
              eventDate.getMonth(),
              eventDate.getDate()
            );
            matchesDate = eventDay.getTime() === today.getTime();
            break;
          case "week":
            const weekFromNow = new Date(
              today.getTime() + 7 * 24 * 60 * 60 * 1000
            );
            matchesDate = eventDate >= today && eventDate <= weekFromNow;
            break;
          case "month":
            const monthFromNow = new Date(
              today.getTime() + 30 * 24 * 60 * 60 * 1000
            );
            matchesDate = eventDate >= today && eventDate <= monthFromNow;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [allEvents, searchTerm, statusFilter, typeFilter, dateFilter]);

  // Statistics
  const stats = useMemo(() => {
    if (!Array.isArray(allEvents)) {
      return {
        total: 0,
        confirmed: 0,
        pending: 0,
        cancelled: 0,
        upcoming: 0,
        totalRevenue: 0,
      };
    }

    const total = allEvents.length;
    const confirmed = allEvents.filter(
      (e) => e && e.status === "confirmed"
    ).length;
    const pending = allEvents.filter((e) => e && e.status === "pending").length;
    const cancelled = allEvents.filter(
      (e) => e && e.status === "cancelled"
    ).length;

    // Calculate upcoming events (confirmed events that haven't started yet)
    const now = new Date();
    const upcoming = allEvents.filter((e) => {
      if (!e || e.status !== "confirmed" || !e.startDateTime) return false;
      const eventStartDate = new Date(e.startDateTime);
      return eventStartDate > now;
    }).length;

    const totalRevenue = allEvents.reduce((sum, e) => {
      const revenue =
        e && typeof e.totalRevenue === "number" ? e.totalRevenue : 0;
      return sum + revenue;
    }, 0);

    return { total, confirmed, pending, cancelled, upcoming, totalRevenue };
  }, [allEvents]);

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (day: number) => {
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );

    return filteredEvents.filter((event) => {
      if (!event.startDateTime) return false;
      const eventDate = new Date(event.startDateTime);
      return (
        eventDate.getFullYear() === targetDate.getFullYear() &&
        eventDate.getMonth() === targetDate.getMonth() &&
        eventDate.getDate() === targetDate.getDate()
      );
    });
  };

  const getEventsForMonth = (monthIndex: number) => {
    return filteredEvents.filter((event) => {
      if (!event.startDateTime) return false;
      const eventDate = new Date(event.startDateTime);
      return (
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventDate.getMonth() === monthIndex
      );
    });
  };

  const getSelectedDateEvents = () => {
    return filteredEvents.filter((event) => {
      if (!event.startDateTime) return false;
      const eventDate = new Date(event.startDateTime);
      return (
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getDate() === currentDate.getDate()
      );
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateYear = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setFullYear(prev.getFullYear() - 1);
      } else {
        newDate.setFullYear(prev.getFullYear() + 1);
      }
      return newDate;
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setDate(prev.getDate() - 1);
      } else {
        newDate.setDate(prev.getDate() + 1);
      }
      return newDate;
    });
  };

  const selectMonth = (monthIndex: number) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(monthIndex);
      return newDate;
    });
    setCalendarViewMode("month");
  };

  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
      case "pending":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20";
      case "cancelled":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
      case "completed":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const getStatusIcon = (status: EventStatus) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <AlertCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getHallNames = (hallIds: string[] | undefined) => {
    if (!hallIds || !Array.isArray(hallIds) || hallIds.length === 0) {
      return "No halls assigned";
    }
    return hallIds
      .map(
        (id) =>
          allHalls.find((hall: any) => hall.id === id)?.name || `Hall ${id}`
      )
      .join(", ");
  };

  const handleViewDetails = (event: Event) => {
    console.log("Viewing event details:", event);
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const handleEdit = (event: Event) => {
    console.log("Editing event:", event);
    setSelectedEvent(event);
    // Create a deep copy of the event data for editing
    setEditFormData({
      ...event,
      startDateTime: event.startDateTime || "",
      endDateTime: event.endDateTime || "",
      notes: event.notes || "",
      organizerName: event.organizerName || "",
      organizerEmail: event.organizerEmail || "",
      organizerPhone: event.organizerPhone || "",
    });
    setShowEditModal(true);
  };

  const handleDelete = async (eventId: string, eventName: string) => {
    console.log("Attempting to delete event:", eventId, eventName);

    if (!eventId) {
      alert("Invalid event ID. Cannot delete event.");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to delete "${eventName}"? This action cannot be undone.`
      )
    ) {
      try {
        console.log("Deleting event with ID:", eventId);
        deleteEvent(eventId);
        console.log("Event deleted successfully");

        // Show success message
        setTimeout(() => {
          alert("Event deleted successfully!");
        }, 100);
      } catch (error) {
        console.error("Failed to delete event:", error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  const handleUpdateEvent = async () => {
    console.log("Updating event:", selectedEvent, editFormData);

    if (!selectedEvent || !editFormData) {
      alert("Missing event data. Cannot update.");
      return;
    }

    // Validate required fields
    if (!editFormData.name?.trim()) {
      alert("Event name is required.");
      return;
    }

    if (!editFormData.organizerName?.trim()) {
      alert("Organizer name is required.");
      return;
    }

    if (!editFormData.startDateTime || !editFormData.endDateTime) {
      alert("Start and end dates are required.");
      return;
    }

    try {
      const updatedEvent = {
        ...selectedEvent,
        ...editFormData,
        updatedAt: new Date().toISOString(),
        // Ensure required fields are properly set
        id: selectedEvent.id,
        createdAt: selectedEvent.createdAt,
      } as Event;

      console.log("Submitting updated event:", updatedEvent);
      updateEvent(updatedEvent);
      console.log("Event updated successfully");

      // Close modal and reset state
      setShowEditModal(false);
      setSelectedEvent(null);
      setEditFormData({});

      // Show success message
      setTimeout(() => {
        alert("Event updated successfully!");
      }, 100);
    } catch (error) {
      console.error("Failed to update event:", error);
      alert("Failed to update event. Please try again.");
    }
  };

  const formatDateTime = (dateTime: string) => {
    if (!dateTime) {
      return { date: "No date", time: "No time" };
    }

    const date = new Date(dateTime);

    if (isNaN(date.getTime())) {
      return { date: "Invalid date", time: "Invalid time" };
    }

    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
            Event Bookings Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and track all event bookings
          </p>
        </div>
        <div className="flex gap-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
            <Button
              variant={viewType === "list" ? "primary" : "outline"}
              size="sm"
              onClick={() => setViewType("list")}
              className="flex items-center gap-2 px-4 py-2"
            >
              <Grid3X3 className="w-4 h-4" />
              List
            </Button>
            <Button
              variant={viewType === "calendar" ? "primary" : "outline"}
              size="sm"
              onClick={() => setViewType("calendar")}
              className="flex items-center gap-2 px-4 py-2"
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </Button>
          </div>

          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          {(() => {
            const NewBookingButton: React.FC = () => {
              const navigate = useNavigate();
              return (
                <Button
                  className="flex items-center gap-2"
                  onClick={() => navigate("/events/booking")}
                >
                  <Plus className="w-4 h-4" />
                  New Booking
                </Button>
              );
            };
            return <NewBookingButton />;
          })()}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
          <div className="p-3 lg:p-4 xl:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-blue-700 truncate">
                  Total Bookings
                </p>
                <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-blue-900">
                  {stats.total}
                </p>
              </div>
              <div className="p-2 bg-blue-500 rounded-full ml-2 flex-shrink-0">
                <Calendar className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
          <div className="p-3 lg:p-4 xl:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-green-700 truncate">
                  Confirmed
                </p>
                <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-green-900">
                  {stats.confirmed}
                </p>
              </div>
              <div className="p-2 bg-green-500 rounded-full ml-2 flex-shrink-0">
                <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-shadow">
          <div className="p-3 lg:p-4 xl:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-yellow-700 truncate">
                  Pending
                </p>
                <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-yellow-900">
                  {stats.pending}
                </p>
              </div>
              <div className="p-2 bg-yellow-500 rounded-full ml-2 flex-shrink-0">
                <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-shadow">
          <div className="p-3 lg:p-4 xl:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-orange-700 truncate">
                  Upcoming
                </p>
                <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-orange-900">
                  {stats.upcoming}
                </p>
              </div>
              <div className="p-2 bg-orange-500 rounded-full ml-2 flex-shrink-0">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md transition-shadow">
          <div className="p-3 lg:p-4 xl:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-red-700 truncate">
                  Cancelled
                </p>
                <p className="text-xl lg:text-2xl xl:text-3xl font-bold text-red-900">
                  {stats.cancelled}
                </p>
              </div>
              <div className="p-2 bg-red-500 rounded-full ml-2 flex-shrink-0">
                <XCircle className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
          <div className="p-3 lg:p-4 xl:p-5">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-purple-700 truncate">
                  Total Revenue
                </p>
                <p className="text-lg lg:text-xl xl:text-2xl font-bold text-purple-900">
                  $
                  {stats.totalRevenue > 1000
                    ? `${Math.round(stats.totalRevenue / 1000)}K`
                    : stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-2 bg-purple-500 rounded-full ml-2 flex-shrink-0">
                <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-white" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <Input
                placeholder="Search by event name, organizer, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <Select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as EventStatus | "all")
                }
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "pending", label: "Pending" },
                  { value: "confirmed", label: "Confirmed" },
                  { value: "completed", label: "Completed" },
                  { value: "cancelled", label: "Cancelled" },
                ]}
              />

              <Select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as EventType | "all")
                }
                options={[
                  { value: "all", label: "All Types" },
                  { value: "conference", label: "Conference" },
                  { value: "wedding", label: "Wedding" },
                  { value: "seminar", label: "Seminar" },
                  { value: "corporate", label: "Corporate" },
                  { value: "birthday", label: "Birthday" },
                  { value: "anniversary", label: "Anniversary" },
                  { value: "meeting", label: "Meeting" },
                  { value: "workshop", label: "Workshop" },
                  { value: "gala", label: "Gala" },
                  { value: "other", label: "Other" },
                ]}
              />

              <Select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value as "all" | "today" | "week" | "month"
                  )
                }
                options={[
                  { value: "all", label: "All Dates" },
                  { value: "today", label: "Today" },
                  { value: "week", label: "This Week" },
                  { value: "month", label: "This Month" },
                ]}
              />

              <Button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setDateFilter("all");
                }}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Filter className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Events Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Event Bookings ({filteredEvents.length})
            {viewType === "calendar" && (
              <span className="ml-2 text-lg font-normal text-gray-600 dark:text-gray-400">
                -{" "}
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {filteredEvents.length} of {allEvents.length} events
            </span>
          </div>
        </div>

        {viewType === "list" ? (
          /* List View */
          filteredEvents.length > 0 ? (
            <div className="grid gap-4">
              {filteredEvents.map((event) => {
                if (!event) return null;

                const startDateTime = formatDateTime(event.startDateTime || "");
                const endDateTime = formatDateTime(event.endDateTime || "");

                return (
                  <Card
                    key={event.id}
                    className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                      {/* Event Details */}
                      <div className="lg:col-span-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {event.name || "Untitled Event"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mb-2">
                          {event.type || "other"} event
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            event.status || "pending"
                          )}`}
                        >
                          {getStatusIcon(event.status || "pending")}
                          {(event.status || "pending").charAt(0).toUpperCase() +
                            (event.status || "pending").slice(1)}
                        </span>
                      </div>

                      {/* Organizer Info */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {event.organizerName || "Unknown Organizer"}
                            </p>
                            {event.organizerEmail && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {event.organizerEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Date & Time */}
                      <div className="lg:col-span-2">
                        <div className="flex items-start gap-2">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {startDateTime.date || "No date"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {startDateTime.time}
                              {endDateTime.time &&
                                endDateTime.time !== startDateTime.time && (
                                  <span> - {endDateTime.time}</span>
                                )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Venue */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-900 dark:text-gray-100">
                              {getHallNames(event.hallIds)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {event.expectedAttendees || 0} attendees
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Revenue */}
                      <div className="lg:col-span-1">
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">
                            ${(event.totalRevenue || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">Revenue</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleViewDetails(event);
                            }}
                            className="flex items-center justify-center w-12 h-12 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 border-blue-200"
                            title="View Details"
                          >
                            <Eye className="w-8 h-8" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(event);
                            }}
                            className="flex items-center justify-center w-12 h-12 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                            title="Edit Event"
                          >
                            <Edit className="w-8 h-8" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDelete(
                                event.id,
                                event.name || "Unnamed Event"
                              );
                            }}
                            className="flex items-center justify-center w-12 h-12 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                            title="Delete Event"
                          >
                            <Trash2 className="w-8 h-8" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  No events found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm ||
                  statusFilter !== "all" ||
                  typeFilter !== "all" ||
                  dateFilter !== "all"
                    ? "Try adjusting your search criteria or filters to find events."
                    : "Get started by creating your first event booking."}
                </p>
                {!searchTerm &&
                  statusFilter === "all" &&
                  typeFilter === "all" &&
                  dateFilter === "all" && (
                    <Button className="flex items-center gap-2 mx-auto">
                      <Plus className="w-4 h-4" />
                      Create New Event
                    </Button>
                  )}
              </div>
            </Card>
          )
        ) : (
          /* Calendar View */
          <Card className="p-6">
            {/* Calendar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {calendarViewMode === "year"
                    ? currentDate.getFullYear()
                    : calendarViewMode === "date"
                    ? currentDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : currentDate.toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                </h3>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      calendarViewMode === "year"
                        ? navigateYear("prev")
                        : calendarViewMode === "date"
                        ? navigateDate("prev")
                        : navigateMonth("prev")
                    }
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      calendarViewMode === "year"
                        ? navigateYear("next")
                        : calendarViewMode === "date"
                        ? navigateDate("next")
                        : navigateMonth("next")
                    }
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Calendar View Mode Selector */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
                  <Button
                    variant={
                      calendarViewMode === "year" ? "primary" : "outline"
                    }
                    size="sm"
                    onClick={() => setCalendarViewMode("year")}
                    className="px-4 py-2 text-xs"
                  >
                    Year
                  </Button>
                  <Button
                    variant={
                      calendarViewMode === "month" ? "primary" : "outline"
                    }
                    size="sm"
                    onClick={() => setCalendarViewMode("month")}
                    className="px-4 py-2 text-xs"
                  >
                    Month
                  </Button>
                  <Button
                    variant={
                      calendarViewMode === "date" ? "primary" : "outline"
                    }
                    size="sm"
                    onClick={() => setCalendarViewMode("date")}
                    className="px-4 py-2 text-xs"
                  >
                    Date
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentDate(new Date());
                    setCalendarViewMode("month");
                  }}
                  className="text-sm"
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Calendar Content */}
            {calendarViewMode === "year" ? (
              /* Year View - Show 12 months */
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 12 }, (_, monthIndex) => {
                  const monthEvents = getEventsForMonth(monthIndex);
                  const monthName = new Date(
                    currentDate.getFullYear(),
                    monthIndex,
                    1
                  ).toLocaleDateString("en-US", { month: "long" });

                  return (
                    <div
                      key={monthIndex}
                      className="cursor-pointer"
                      onClick={() => selectMonth(monthIndex)}
                    >
                      <Card className="p-4 hover:shadow-md transition-shadow">
                        <div className="text-center">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {monthName}
                          </h4>
                          <div className="text-2xl font-bold text-blue-600 mb-2">
                            {monthEvents.length}
                          </div>
                          <div className="text-xs text-gray-500">Events</div>

                          {monthEvents.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {monthEvents.slice(0, 3).map((event: Event) => (
                                <div
                                  key={event.id}
                                  className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 truncate"
                                >
                                  {event.name || "Untitled Event"}
                                </div>
                              ))}
                              {monthEvents.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{monthEvents.length - 3} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            ) : calendarViewMode === "date" ? (
              /* Date View - Show events for selected date */
              <div className="space-y-4">
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Calendar className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                  <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {currentDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getSelectedDateEvents().length} events scheduled
                  </p>
                </div>

                {getSelectedDateEvents().length > 0 ? (
                  <div className="grid gap-4">
                    {getSelectedDateEvents().map((event: Event) => {
                      const startDateTime = formatDateTime(
                        event.startDateTime || ""
                      );
                      const endDateTime = formatDateTime(
                        event.endDateTime || ""
                      );

                      return (
                        <div
                          key={event.id}
                          className="cursor-pointer"
                          onClick={() => handleViewDetails(event)}
                        >
                          <Card className="p-4 hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                  {event.name || "Untitled Event"}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  {startDateTime.time}
                                  {endDateTime.time &&
                                    endDateTime.time !== startDateTime.time && (
                                      <span> - {endDateTime.time}</span>
                                    )}
                                </p>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    event.status || "pending"
                                  )}`}
                                >
                                  {getStatusIcon(event.status || "pending")}
                                  {(event.status || "pending")
                                    .charAt(0)
                                    .toUpperCase() +
                                    (event.status || "pending").slice(1)}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {event.organizerName || "Unknown Organizer"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {event.expectedAttendees || 0} attendees
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No events scheduled for this date
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Month View - Traditional calendar grid */
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                {/* Day Headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="bg-gray-50 dark:bg-gray-800 p-3 text-center"
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {day}
                      </span>
                    </div>
                  )
                )}

                {/* Calendar Days */}
                {(() => {
                  const daysInMonth = getDaysInMonth(currentDate);
                  const firstDay = getFirstDayOfMonth(currentDate);
                  const days = [];

                  // Empty cells for days before the first day of month
                  for (let i = 0; i < firstDay; i++) {
                    days.push(
                      <div
                        key={`empty-${i}`}
                        className="bg-white dark:bg-gray-900 h-32 p-2"
                      ></div>
                    );
                  }

                  // Days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dayEvents = getEventsForDate(day);
                    const isToday =
                      new Date().getFullYear() === currentDate.getFullYear() &&
                      new Date().getMonth() === currentDate.getMonth() &&
                      new Date().getDate() === day;

                    days.push(
                      <div
                        key={day}
                        className={`bg-white dark:bg-gray-900 h-32 p-2 border-t border-gray-200 dark:border-gray-700 overflow-hidden ${
                          isToday ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={`text-sm font-medium ${
                              isToday
                                ? "bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {day}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Events for this day */}
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => {
                            const startTime = event.startDateTime
                              ? new Date(
                                  event.startDateTime
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "";

                            return (
                              <div
                                key={event.id}
                                onClick={() => handleViewDetails(event)}
                                className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                                  event.status === "confirmed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : event.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : event.status === "cancelled"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                }`}
                              >
                                <div className="font-medium truncate">
                                  {event.name || "Untitled Event"}
                                </div>
                                {startTime && (
                                  <div className="opacity-75">{startTime}</div>
                                )}
                              </div>
                            );
                          })}

                          {/* Show "+X more" if there are more events */}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 p-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return days;
                })()}
              </div>
            )}

            {/* Calendar Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Confirmed
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Pending
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Cancelled
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-gray-600 dark:text-gray-400">
                  Completed
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedEvent.name || "Unnamed Event"}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        selectedEvent.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : selectedEvent.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : selectedEvent.status === "completed"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedEvent.status === "confirmed" && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {selectedEvent.status === "pending" && (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {selectedEvent.status === "completed" && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      {selectedEvent.status === "cancelled" && (
                        <XCircle className="w-4 h-4" />
                      )}
                      {(selectedEvent.status || "pending")
                        .charAt(0)
                        .toUpperCase() +
                        (selectedEvent.status || "pending").slice(1)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Event ID: {selectedEvent.id}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEvent(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      Event Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Event Type
                          </label>
                          <p className="text-lg text-gray-900 dark:text-gray-100 capitalize font-medium">
                            {selectedEvent.type || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Expected Attendees
                          </label>
                          <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                            {selectedEvent.expectedAttendees || 0}
                            {selectedEvent.actualAttendees && (
                              <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
                                (Actual: {selectedEvent.actualAttendees})
                              </span>
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Created
                          </label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedEvent.createdAt
                              ? new Date(
                                  selectedEvent.createdAt
                                ).toLocaleDateString()
                              : "Not available"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Start Date & Time
                          </label>
                          <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                            {selectedEvent.startDateTime ? (
                              <>
                                {new Date(
                                  selectedEvent.startDateTime
                                ).toLocaleDateString()}
                                <br />
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    selectedEvent.startDateTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </>
                            ) : (
                              "Not set"
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            End Date & Time
                          </label>
                          <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                            {selectedEvent.endDateTime ? (
                              <>
                                {new Date(
                                  selectedEvent.endDateTime
                                ).toLocaleDateString()}
                                <br />
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    selectedEvent.endDateTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </>
                            ) : (
                              "Not set"
                            )}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Last Updated
                          </label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {selectedEvent.updatedAt
                              ? new Date(
                                  selectedEvent.updatedAt
                                ).toLocaleDateString()
                              : "Not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Organizer Information */}
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-green-500" />
                      Organizer Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Name
                        </label>
                        <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                          {selectedEvent.organizerName || "Not provided"}
                        </p>
                      </div>
                      {selectedEvent.organizerEmail && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Email
                          </label>
                          <p className="text-gray-900 dark:text-gray-100">
                            <a
                              href={`mailto:${selectedEvent.organizerEmail}`}
                              className="text-blue-600 hover:underline"
                            >
                              {selectedEvent.organizerEmail}
                            </a>
                          </p>
                        </div>
                      )}
                      {selectedEvent.organizerPhone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Phone
                          </label>
                          <p className="text-gray-900 dark:text-gray-100">
                            <a
                              href={`tel:${selectedEvent.organizerPhone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {selectedEvent.organizerPhone}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Venue Information */}
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-500" />
                      Venue & Location
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Assigned Halls
                        </label>
                        <p className="text-lg text-gray-900 dark:text-gray-100 font-medium">
                          {getHallNames(selectedEvent.hallIds || [])}
                        </p>
                      </div>
                      {selectedEvent.hallIds &&
                        selectedEvent.hallIds.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedEvent.hallIds.map((hallId) => {
                              const hall = allHalls.find(
                                (h: any) => h.id === hallId
                              );
                              return hall ? (
                                <div
                                  key={hallId}
                                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                                >
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {hall.name}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Capacity:{" "}
                                    {(hall as any).capacity || "Not specified"}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Location:{" "}
                                    {(hall as any).location || "Main building"}
                                  </p>
                                </div>
                              ) : (
                                <div
                                  key={hallId}
                                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700"
                                >
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    Hall {hallId}
                                  </h4>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Details not available
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  </Card>
                </div>

                {/* Side Panel */}
                <div className="space-y-6">
                  {/* Financial Summary */}
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Financial Summary
                    </h3>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                        <label className="text-sm font-medium text-green-600 dark:text-green-400">
                          Total Revenue
                        </label>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                          ${(selectedEvent.totalRevenue || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                        <label className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          Event Type
                        </label>
                        <p className="text-lg font-semibold text-blue-700 dark:text-blue-300 capitalize">
                          {selectedEvent.type || "General"}
                        </p>
                      </div>
                    </div>
                  </Card>

                  {/* Notes */}
                  {selectedEvent.notes && (
                    <Card className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Notes
                      </h3>
                      <p className="text-gray-900 dark:text-gray-100 leading-relaxed">
                        {selectedEvent.notes}
                      </p>
                    </Card>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEdit(selectedEvent);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Event
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEvent(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Edit Event: {selectedEvent.name}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Name *
                    </label>
                    <Input
                      value={editFormData.name || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Event name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Type
                    </label>
                    <Select
                      value={editFormData.type || "conference"}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          type: e.target.value as EventType,
                        })
                      }
                      options={[
                        { value: "conference", label: "Conference" },
                        { value: "wedding", label: "Wedding" },
                        { value: "seminar", label: "Seminar" },
                        { value: "corporate", label: "Corporate" },
                        { value: "birthday", label: "Birthday" },
                        { value: "anniversary", label: "Anniversary" },
                        { value: "meeting", label: "Meeting" },
                        { value: "workshop", label: "Workshop" },
                        { value: "gala", label: "Gala" },
                        { value: "other", label: "Other" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <Select
                      value={editFormData.status || "pending"}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          status: e.target.value as EventStatus,
                        })
                      }
                      options={[
                        { value: "pending", label: "Pending" },
                        { value: "confirmed", label: "Confirmed" },
                        { value: "completed", label: "Completed" },
                        { value: "cancelled", label: "Cancelled" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Revenue ($)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormData.totalRevenue || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          totalRevenue: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Organizer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Organizer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organizer Name *
                    </label>
                    <Input
                      value={editFormData.organizerName || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          organizerName: e.target.value,
                        })
                      }
                      placeholder="Organizer name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organizer Email
                    </label>
                    <Input
                      type="email"
                      value={editFormData.organizerEmail || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          organizerEmail: e.target.value,
                        })
                      }
                      placeholder="organizer@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organizer Phone
                    </label>
                    <Input
                      type="tel"
                      value={editFormData.organizerPhone || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          organizerPhone: e.target.value,
                        })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date & Time *
                    </label>
                    <Input
                      type="datetime-local"
                      value={
                        editFormData.startDateTime
                          ? new Date(editFormData.startDateTime)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          startDateTime: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : "",
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date & Time *
                    </label>
                    <Input
                      type="datetime-local"
                      value={
                        editFormData.endDateTime
                          ? new Date(editFormData.endDateTime)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          endDateTime: e.target.value
                            ? new Date(e.target.value).toISOString()
                            : "",
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Attendees
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expected Attendees
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={editFormData.expectedAttendees || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          expectedAttendees: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Number of expected attendees"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Actual Attendees
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={editFormData.actualAttendees || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          actualAttendees:
                            parseInt(e.target.value) || undefined,
                        })
                      }
                      placeholder="Actual number of attendees"
                    />
                  </div>
                </div>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Services & Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Decoration Type
                    </label>
                    <Input
                      value={editFormData.decorationType || ""}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          decorationType: e.target.value,
                        })
                      }
                      placeholder="e.g., Elegant, Minimalist, Themed"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Equipment Needed
                    </label>
                    <Input
                      value={
                        Array.isArray(editFormData.equipmentNeeds)
                          ? editFormData.equipmentNeeds.join(", ")
                          : ""
                      }
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          equipmentNeeds: e.target.value
                            ? e.target.value
                                .split(",")
                                .map((item) => item.trim())
                            : [],
                        })
                      }
                      placeholder="Projector, Microphone, Sound system (comma separated)"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catering Requirements
                  </label>
                  <textarea
                    value={editFormData.cateringRequirements || ""}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        cateringRequirements: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                    rows={3}
                    placeholder="Describe catering needs, dietary restrictions, menu preferences..."
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Additional Notes
                </h3>
                <textarea
                  value={editFormData.notes || ""}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                  rows={4}
                  placeholder="Additional notes, special requests, important details..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditFormData({});
                  setSelectedEvent(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateEvent}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={
                  !editFormData.name?.trim() ||
                  !editFormData.organizerName?.trim()
                }
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventBookingsOverview;
