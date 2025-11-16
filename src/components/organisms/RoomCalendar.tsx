import React, { useMemo, useState } from "react";

type HousekeepingTicket = {
  id: string;
  room: string;
  status: string;
  openedAt?: string;
  checkoutAt?: string;
  progress?: number;
};

type RoomRecord = {
  number: string;
  type?: string;
};

type ReservationRecord = {
  id: string;
  room: string;
  checkIn: string;
  checkOut: string;
  status: string;
};

const statusMeta = {
  available: {
    label: "Available",
    color: "bg-green-500 text-white",
    dotColor: "bg-green-500",
  },
  occupied: {
    label: "Occupied",
    color: "bg-rose-500/80 text-white",
    dotColor: "bg-rose-500",
  },
  arrival: {
    label: "Arrival/Departure",
    color: "bg-amber-400 text-slate-900",
    dotColor: "bg-amber-400",
  },
  maintenance: {
    label: "House Keeping",
    color: "bg-indigo-400 text-white",
    dotColor: "bg-indigo-400",
  },
  sameday: {
    label: "Same-day Stay",
    color: "bg-sky-400 text-white",
    dotColor: "bg-sky-400",
  },
} as const;

type CalendarStatus = keyof typeof statusMeta;

const formatMonth = (date: Date) =>
  date.toLocaleDateString(undefined, { month: "long", year: "numeric" });

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDay = (value: Date | string) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

interface RoomCalendarProps {
  heading?: string;
  rooms: RoomRecord[];
  reservations: ReservationRecord[];
  housekeeping: HousekeepingTicket[];
  onCellSelect?: (payload: { roomNumber: string; date: Date }) => void;
}

const RoomCalendar: React.FC<RoomCalendarProps> = ({
  heading,
  rooms,
  reservations,
  housekeeping,
  onCellSelect,
}) => {
  const [cursor, setCursor] = useState(() => {
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const calendarDays = useMemo(() => {
    const lastDay = new Date(
      cursor.getFullYear(),
      cursor.getMonth() + 1,
      0
    ).getDate();
    return Array.from({ length: lastDay }).map((_, index) => {
      const date = new Date(cursor);
      date.setDate(index + 1);
      return date;
    });
  }, [cursor]);

  const getMaintenanceTicket = (roomNumber: string, date: Date) => {
    return housekeeping.find((ticket) => {
      if (ticket.room !== roomNumber || ticket.status === "Completed")
        return false;
      const windowStart = ticket.openedAt
        ? startOfDay(ticket.openedAt)
        : startOfDay(new Date());
      const windowEnd = ticket.checkoutAt
        ? startOfDay(ticket.checkoutAt)
        : startOfDay(windowStart);
      return date >= windowStart && date <= windowEnd;
    });
  };

  const statusForDay = (
    roomNumber: string,
    date: Date
  ): { status: CalendarStatus; progress?: number } => {
    const maintenanceTicket = getMaintenanceTicket(roomNumber, date);
    if (maintenanceTicket) {
      return { status: "maintenance", progress: maintenanceTicket.progress };
    }

    const reservation = reservations.find((entry) => {
      if (entry.room !== roomNumber || entry.status === "Cancelled")
        return false;
      const checkIn = startOfDay(entry.checkIn);
      const checkOut = startOfDay(entry.checkOut);

      if (sameDay(checkIn, checkOut)) {
        return sameDay(date, checkIn);
      }

      return date >= checkIn && date <= checkOut;
    });

    if (!reservation) return { status: "available" };

    const checkIn = startOfDay(reservation.checkIn);
    const checkOut = startOfDay(reservation.checkOut);
    const isSameDayStay = sameDay(checkIn, checkOut);

    if (isSameDayStay && sameDay(date, checkIn)) {
      return { status: "sameday" };
    }

    if (sameDay(date, checkIn) || sameDay(date, checkOut)) {
      return { status: "arrival" };
    }

    if (date > checkIn && date < checkOut) {
      return { status: "occupied" };
    }

    return { status: "available" };
  };

  const goToPreviousMonth = () => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <section className="rounded-3xl bg-white shadow-2xl border border-emerald-100 space-y-5 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {heading && (
            <h2 className="text-2xl font-bold text-emerald-900">{heading}</h2>
          )}
          <p className="text-sm text-emerald-600">
            Quick glance of each room status across the selected month.
          </p>
          <p className="text-xs font-semibold text-emerald-400">
            {formatMonth(cursor)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded-full border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50"
            aria-label="Previous month"
          >
            &lt;
          </button>
          <div className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 bg-white">
            {cursor.toLocaleDateString(undefined, { month: "long" })}
          </div>
          <div className="rounded-2xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 bg-white">
            {cursor.getFullYear()}
          </div>
          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-full border border-emerald-200 px-3 py-1 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50"
            aria-label="Next month"
          >
            &gt;
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 text-xs font-semibold text-emerald-600">
        {Object.entries(statusMeta).map(([key, meta]) => (
          <span key={key} className="inline-flex items-center gap-2">
            <span className={`h-3.5 w-3.5 rounded-full ${meta.dotColor}`} />
            {meta.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-emerald-100 bg-white shadow-lg">
        <table className="min-w-full text-xs">
          <thead className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 text-emerald-600">
            <tr>
              <th className="sticky left-0 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wide">
                Room
              </th>
              {calendarDays.map((day) => (
                <th
                  key={day.toISOString()}
                  className="px-2 py-3 text-center font-semibold"
                >
                  {day.getDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr
                key={room.number}
                className="border-t border-emerald-100 text-center"
              >
                <td className="sticky left-0 bg-white px-4 py-3 text-left text-sm font-semibold text-emerald-900 shadow-md">
                  <div>{room.number}</div>
                  <p className="text-xs font-normal text-emerald-500">
                    {room.type || "Standard"}
                  </p>
                </td>
                {calendarDays.map((day) => {
                  const { status, progress } = statusForDay(room.number, day);
                  const classes =
                    statusMeta[status]?.color ?? statusMeta.available.color;
                  const interactive =
                    status !== "available" && Boolean(onCellSelect);

                  return (
                    <td
                      key={`${room.number}-${day.toISOString()}`}
                      className="px-1 py-2"
                    >
                      <span
                        onClick={() =>
                          interactive &&
                          onCellSelect?.({ roomNumber: room.number, date: day })
                        }
                        className={`flex h-10 w-12 flex-col items-center justify-center rounded-xl text-[11px] font-semibold ${classes} ${
                          interactive
                            ? "cursor-pointer ring-2 ring-transparent hover:ring-white/80"
                            : ""
                        }`}
                      >
                        <span>{day.getDate()}</span>
                        {status === "maintenance" &&
                          typeof progress === "number" && (
                            <span className="text-[9px] font-bold">
                              {progress}%
                            </span>
                          )}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr>
                <td
                  colSpan={calendarDays.length + 1}
                  className="px-4 py-6 text-center text-sm text-emerald-500"
                >
                  No rooms available for this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default RoomCalendar;
