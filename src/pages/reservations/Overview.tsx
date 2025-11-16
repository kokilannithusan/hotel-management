import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { PieChart } from "../../components/charts/PieChart";
import { Button } from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "../../components/forms/DatePicker";

export const ReservationsOverview: React.FC = () => {
  const { state } = useHotel();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredReservations = state.reservations.filter((r) => {
    if (startDate && r.checkIn < startDate) return false;
    if (endDate && r.checkIn > endDate) return false;
    return true;
  });

  const totalReservations = filteredReservations.length;
  const todayReservations = filteredReservations.filter((r) => {
    const today = new Date().toISOString().split("T")[0];
    return r.checkIn === today;
  }).length;
  const upcomingReservations = filteredReservations.filter((r) => {
    const today = new Date().toISOString().split("T")[0];
    return r.checkIn > today && r.status === "confirmed";
  }).length;
  const canceledReservations = filteredReservations.filter(
    (r) => r.status === "canceled"
  ).length;

  const statusData = [
    {
      name: "Confirmed",
      value: filteredReservations.filter((r) => r.status === "confirmed")
        .length,
      color: "#3b82f6",
    },
    {
      name: "Checked-in",
      value: filteredReservations.filter((r) => r.status === "checked-in")
        .length,
      color: "#10b981",
    },
    {
      name: "Checked-out",
      value: filteredReservations.filter((r) => r.status === "checked-out")
        .length,
      color: "#6b7280",
    },
    { name: "Canceled", value: canceledReservations, color: "#ef4444" },
  ];

  const channelData = state.channels.map((channel) => ({
    name: channel.name,
    count: filteredReservations.filter((r) => r.channelId === channel.id)
      .length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            Reservations Overview
          </h1>
          <p className="text-slate-600 mt-1">
            Manage and track all hotel reservations
          </p>
        </div>
        <Button onClick={() => navigate("/reservations/reserve")}>
          Reserve Room
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-stagger">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover-lift">
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
            Total Reservations
          </p>
          <p className="text-4xl font-bold text-blue-900 mt-2">
            {totalReservations}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover-lift">
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
            Today
          </p>
          <p className="text-4xl font-bold text-blue-900 mt-2">
            {todayReservations}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover-lift">
          <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
            Upcoming
          </p>
          <p className="text-4xl font-bold text-green-900 mt-2">
            {upcomingReservations}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover-lift">
          <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
            Canceled
          </p>
          <p className="text-4xl font-bold text-red-900 mt-2">
            {canceledReservations}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-stagger">
        <Card title="Reservation Status" className="hover-lift">
          <PieChart data={statusData} />
        </Card>
        <Card title="Reservations by Channel" className="hover-lift">
          <div className="space-y-2">
            {channelData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg transition-all duration-200 hover:from-blue-50 hover:shadow-sm"
              >
                <span className="font-medium text-slate-700">{item.name}</span>
                <span className="text-blue-600 font-bold text-lg">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
