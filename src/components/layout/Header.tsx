import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  Calendar,
  Clock,
  Bell,
  Plus,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const notifications = [
    {
      id: 1,
      title: "New Reservation",
      message: "Room 101 booked for tonight",
      time: "5 min ago",
    },
    {
      id: 2,
      title: "Check-out Reminder",
      message: "Room 205 checking out at 11 AM",
      time: "15 min ago",
    },
    {
      id: 3,
      title: "Payment Received",
      message: "Payment confirmed for Booking #1234",
      time: "1 hour ago",
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm sticky top-0 z-50">
      {/* Left: Date and Time Display */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-slate-700">
            {formatDate(currentTime)}
          </span>
        </div>
        <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* Right: Actions and User Profile */}
      <div className="flex items-center space-x-3">
        {/* Add Reservation Button */}
        <button
          onClick={() => navigate("/reservations/reserve")}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          title="Add New Reservation"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Add Reservation</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">
                    Notifications
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {notif.title}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {notif.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {notif.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-200 text-center">
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-300"></div>

        {/* User Profile */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-sm font-semibold text-slate-900">
                  {user.name}
                </div>
                <div className="text-xs text-slate-500">Administrator</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
                  <div className="p-4 border-b border-slate-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {user.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <button className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors text-left">
                      <User className="w-4 h-4 text-slate-600" />
                      <span className="text-sm font-medium text-slate-700">
                        My Profile
                      </span>
                    </button>
                    <button
                      onClick={logout}
                      className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left group"
                    >
                      <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-600" />
                      <span className="text-sm font-medium text-slate-700 group-hover:text-red-600">
                        Logout
                      </span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
