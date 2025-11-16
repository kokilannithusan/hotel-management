import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Users,
  Building2,
  FileText,
  RefreshCw,
  AlertTriangle,
  Clock,
  Star,
  PieChart,
  Activity,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Table } from "../../components/ui/Table";
import { BarChart } from "../../components/charts/BarChart";
import { PieChart as PieChartComponent } from "../../components/charts/PieChart";
import {
  Event,
  Hall,
  EventPackage,
  EventType,
  EventStatus,
} from "../../types/entities";

// Define PaymentStatus type
type PaymentStatus =
  | "pending"
  | "paid"
  | "partially_paid"
  | "refunded"
  | "cancelled";

interface ReportFilter {
  startDate: string;
  endDate: string;
  eventType: string;
  status: string;
  hallId: string;
  packageId: string;
  paymentStatus: string;
  minRevenue: string;
  maxRevenue: string;
}

interface RevenueReportData {
  period: string;
  revenue: number;
  events: number;
  attendees: number;
  averageTicketPrice: number;
  profit: number;
  costs: number;
}

interface HallUtilizationData {
  hallName: string;
  occupancyRate: number;
  totalBookings: number;
  revenue: number;
  maintenanceHours: number;
  averageBookingDuration: number;
  peakHours: string[];
  efficiency: number;
}

interface PackagePerformanceData {
  packageName: string;
  bookings: number;
  revenue: number;
  averagePrice: number;
  popularityScore: number;
  customerSatisfaction: number;
  refundRate: number;
}

interface CancellationData {
  month: string;
  cancellations: number;
  reason: string;
  refundAmount: number;
  cancellationRate: number;
  lostRevenue: number;
}

interface CustomerInsightData {
  segmentName: string;
  customerCount: number;
  averageSpend: number;
  repeatBookingRate: number;
  preferredEventTypes: EventType[];
  seasonalTrends: string[];
}

interface FinancialReportData {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
}

export const EventReporting: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string>("revenue");
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days ago
    endDate: new Date().toISOString().split("T")[0], // today
    eventType: "all",
    status: "all",
    hallId: "all",
    packageId: "all",
    paymentStatus: "all",
    minRevenue: "",
    maxRevenue: "",
  });

  // Mock data for reports - in real app this would come from API calls
  const mockRevenueData: RevenueReportData[] = [
    {
      period: "Week 1",
      revenue: 12500,
      events: 5,
      attendees: 230,
      averageTicketPrice: 54.35,
      profit: 8750,
      costs: 3750,
    },
    {
      period: "Week 2",
      revenue: 18750,
      events: 7,
      attendees: 340,
      averageTicketPrice: 55.15,
      profit: 13125,
      costs: 5625,
    },
    {
      period: "Week 3",
      revenue: 22100,
      events: 8,
      attendees: 410,
      averageTicketPrice: 53.9,
      profit: 15470,
      costs: 6630,
    },
    {
      period: "Week 4",
      revenue: 16800,
      events: 6,
      attendees: 285,
      averageTicketPrice: 58.95,
      profit: 11760,
      costs: 5040,
    },
  ];

  const mockHallUtilization: HallUtilizationData[] = [
    {
      hallName: "Grand Ballroom",
      occupancyRate: 78,
      totalBookings: 12,
      revenue: 28500,
      maintenanceHours: 8,
      averageBookingDuration: 6.5,
      peakHours: ["18:00-22:00", "14:00-18:00"],
      efficiency: 85,
    },
    {
      hallName: "Conference Room A",
      occupancyRate: 65,
      totalBookings: 18,
      revenue: 14200,
      maintenanceHours: 4,
      averageBookingDuration: 4.2,
      peakHours: ["09:00-12:00", "14:00-17:00"],
      efficiency: 72,
    },
    {
      hallName: "Rooftop Terrace",
      occupancyRate: 45,
      totalBookings: 8,
      revenue: 16800,
      maintenanceHours: 12,
      averageBookingDuration: 5.8,
      peakHours: ["16:00-20:00"],
      efficiency: 58,
    },
  ];

  const mockPackagePerformance: PackagePerformanceData[] = [
    {
      packageName: "Premium Wedding",
      bookings: 8,
      revenue: 40000,
      averagePrice: 5000,
      popularityScore: 92,
      customerSatisfaction: 4.7,
      refundRate: 2.5,
    },
    {
      packageName: "Corporate Meeting",
      bookings: 15,
      revenue: 12000,
      averagePrice: 800,
      popularityScore: 78,
      customerSatisfaction: 4.2,
      refundRate: 5.0,
    },
    {
      packageName: "Birthday Celebration",
      bookings: 6,
      revenue: 15000,
      averagePrice: 2500,
      popularityScore: 65,
      customerSatisfaction: 4.5,
      refundRate: 3.2,
    },
    {
      packageName: "Gala Night",
      bookings: 3,
      revenue: 22500,
      averagePrice: 7500,
      popularityScore: 88,
      customerSatisfaction: 4.9,
      refundRate: 1.0,
    },
  ];

  const mockCancellationData: CancellationData[] = [
    {
      month: "Oct 2024",
      cancellations: 2,
      reason: "Date Change Request",
      refundAmount: 3500,
      cancellationRate: 8.3,
      lostRevenue: 4200,
    },
    {
      month: "Nov 2024",
      cancellations: 1,
      reason: "Weather Concerns",
      refundAmount: 1200,
      cancellationRate: 4.2,
      lostRevenue: 1800,
    },
    {
      month: "Dec 2024",
      cancellations: 3,
      reason: "Budget Constraints",
      refundAmount: 8750,
      cancellationRate: 12.5,
      lostRevenue: 11250,
    },
  ];

  const mockCustomerInsights: CustomerInsightData[] = [
    {
      segmentName: "Corporate Clients",
      customerCount: 45,
      averageSpend: 2800,
      repeatBookingRate: 68,
      preferredEventTypes: [
        "corporate" as EventType,
        "conference" as EventType,
      ],
      seasonalTrends: ["Q1 Peak", "Q3 Low"],
    },
    {
      segmentName: "Wedding Couples",
      customerCount: 23,
      averageSpend: 5200,
      repeatBookingRate: 15,
      preferredEventTypes: ["wedding" as EventType, "anniversary" as EventType],
      seasonalTrends: ["Summer Peak", "Winter Low"],
    },
    {
      segmentName: "Event Planners",
      customerCount: 12,
      averageSpend: 3600,
      repeatBookingRate: 85,
      preferredEventTypes: [
        "gala" as EventType,
        "birthday" as EventType,
        "other" as EventType,
      ],
      seasonalTrends: ["Holiday Peak", "Steady Year-round"],
    },
  ];

  const mockFinancialData: FinancialReportData[] = [
    {
      category: "Event Revenue",
      budgeted: 75000,
      actual: 70150,
      variance: -4850,
      variancePercentage: -6.5,
    },
    {
      category: "Operating Costs",
      budgeted: 25000,
      actual: 21045,
      variance: -3955,
      variancePercentage: -15.8,
    },
    {
      category: "Marketing Spend",
      budgeted: 8000,
      actual: 9200,
      variance: 1200,
      variancePercentage: 15.0,
    },
    {
      category: "Staff Costs",
      budgeted: 15000,
      actual: 14650,
      variance: -350,
      variancePercentage: -2.3,
    },
  ];

  const mockEvents: Event[] = [
    {
      id: "1",
      name: "Annual Corporate Gala",
      type: "gala" as EventType,
      organizerName: "ABC Corporation",
      organizerEmail: "events@abccorp.com",
      organizerPhone: "+1-555-0123",
      identificationType: "nic" as any,
      identificationNumber: "123456789",
      startDateTime: "2024-12-15T18:00:00Z",
      endDateTime: "2024-12-15T23:00:00Z",
      expectedAttendees: 200,
      hallIds: ["1"],
      packageId: "1",
      totalRevenue: 7500,
      status: "confirmed" as EventStatus,
      paymentStatus: "paid" as PaymentStatus,
      createdAt: "2024-11-01T00:00:00Z",
      updatedAt: "2024-11-01T00:00:00Z",
      createdBy: "user1",
      actualAttendees: 185,
      customerSatisfactionRating: 4.7,
    },
    {
      id: "2",
      name: "Wedding Reception",
      type: "wedding" as EventType,
      organizerName: "John & Jane Smith",
      organizerEmail: "johnsmith@email.com",
      organizerPhone: "+1-555-0456",
      identificationType: "passport" as any,
      identificationNumber: "A12345678",
      startDateTime: "2024-12-20T16:00:00Z",
      endDateTime: "2024-12-20T23:00:00Z",
      expectedAttendees: 150,
      hallIds: ["1"],
      packageId: "1",
      totalRevenue: 5000,
      status: "confirmed" as EventStatus,
      paymentStatus: "paid" as PaymentStatus,
      createdAt: "2024-10-15T00:00:00Z",
      updatedAt: "2024-10-15T00:00:00Z",
      createdBy: "user2",
      actualAttendees: 142,
      customerSatisfactionRating: 4.9,
    },
    {
      id: "3",
      name: "Tech Conference 2024",
      type: "conference" as EventType,
      organizerName: "Tech Solutions Inc",
      organizerEmail: "events@techsolutions.com",
      organizerPhone: "+1-555-0789",
      identificationType: "nic" as any,
      identificationNumber: "987654321",
      startDateTime: "2024-11-25T09:00:00Z",
      endDateTime: "2024-11-25T17:00:00Z",
      expectedAttendees: 100,
      hallIds: ["2"],
      packageId: "2",
      totalRevenue: 2400,
      status: "completed" as EventStatus,
      paymentStatus: "paid" as PaymentStatus,
      createdAt: "2024-10-01T00:00:00Z",
      updatedAt: "2024-11-26T00:00:00Z",
      createdBy: "user3",
      actualAttendees: 95,
      customerSatisfactionRating: 4.3,
    },
  ];

  const mockHalls: Hall[] = [
    {
      id: "1",
      name: "Grand Ballroom",
      capacity: 300,
      location: "Ground Floor",
      facilities: ["Audio System", "Lighting", "Air Conditioning", "Stage"],
      pricePerHour: 250,
      pricePerDay: 2000,
      status: "available",
      description: "Elegant ballroom perfect for weddings and galas",
      images: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Conference Room A",
      capacity: 50,
      location: "Second Floor",
      facilities: ["Projector", "WiFi", "Whiteboard", "Air Conditioning"],
      pricePerHour: 75,
      pricePerDay: 600,
      status: "available",
      description: "Professional conference room for business meetings",
      images: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      name: "Rooftop Terrace",
      capacity: 80,
      location: "Rooftop",
      facilities: ["Outdoor Setting", "City View", "Bar Area"],
      pricePerHour: 180,
      pricePerDay: 1440,
      status: "available",
      description: "Beautiful outdoor terrace with city views",
      images: [],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  const mockPackages: EventPackage[] = [
    {
      id: "1",
      name: "Premium Wedding",
      description: "Complete wedding package with all amenities",
      includedServices: ["Catering", "Photography", "Decoration", "Music"],
      basePrice: 5000,
      taxRate: 8.5,
      duration: "full-day",
      applicableEventTypes: ["wedding" as EventType],
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      name: "Corporate Meeting",
      description: "Professional meeting package for business events",
      includedServices: ["AV Equipment", "Coffee Service", "Stationery"],
      basePrice: 800,
      taxRate: 8.5,
      duration: "half-day",
      applicableEventTypes: ["corporate" as EventType, "meeting" as EventType],
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      name: "Gala Night",
      description: "Luxury gala package for special occasions",
      includedServices: [
        "Premium Catering",
        "Entertainment",
        "Luxury Decor",
        "Valet Service",
      ],
      basePrice: 7500,
      taxRate: 8.5,
      duration: "full-day",
      applicableEventTypes: ["gala" as EventType, "anniversary" as EventType],
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
  ];

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalRevenue = mockRevenueData.reduce(
      (sum, data) => sum + data.revenue,
      0
    );
    const totalEvents = mockRevenueData.reduce(
      (sum, data) => sum + data.events,
      0
    );
    const totalAttendees = mockRevenueData.reduce(
      (sum, data) => sum + data.attendees,
      0
    );
    const totalProfit = mockRevenueData.reduce(
      (sum, data) => sum + data.profit,
      0
    );
    const totalCosts = mockRevenueData.reduce(
      (sum, data) => sum + data.costs,
      0
    );
    const averageRevenuePerEvent = totalRevenue / totalEvents;
    const profitMargin = (totalProfit / totalRevenue) * 100;
    const averageAttendanceRate = 87.5; // Based on mock data calculations
    const topPerformingHall = mockHallUtilization.reduce((prev, current) =>
      prev.revenue > current.revenue ? prev : current
    );
    const totalCancellations = mockCancellationData.reduce(
      (sum, data) => sum + data.cancellations,
      0
    );

    return {
      totalRevenue,
      totalEvents,
      totalAttendees,
      totalProfit,
      totalCosts,
      averageRevenuePerEvent: averageRevenuePerEvent.toFixed(0),
      profitMargin: profitMargin.toFixed(1),
      averageAttendanceRate: averageAttendanceRate.toFixed(1),
      topPerformingHall: topPerformingHall.hallName,
      totalCancellations,
      cancellationRate: ((totalCancellations / totalEvents) * 100).toFixed(1),
    };
  }, [mockRevenueData, mockHallUtilization, mockCancellationData]);

  const handleExport = (reportType: string, format: string) => {
    console.log(`Exporting ${reportType} report as ${format}`);
    // In real app, this would generate and download the report
  };

  const handleFilterChange = (key: keyof ReportFilter, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case "revenue":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Revenue Report
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleExport("revenue", "pdf")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleExport("revenue", "excel")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Revenue Trend">
                <div className="p-6">
                  <BarChart
                    data={mockRevenueData.map((d) => ({
                      name: d.period,
                      revenue: d.revenue,
                    }))}
                    dataKeys={["revenue"]}
                    colors={["#3B82F6"]}
                  />
                </div>
              </Card>

              <Card title="Events by Period">
                <div className="p-6">
                  <BarChart
                    data={mockRevenueData.map((d) => ({
                      name: d.period,
                      events: d.events,
                    }))}
                    dataKeys={["events"]}
                    colors={["#10B981"]}
                  />
                </div>
              </Card>
            </div>

            <Card title="Detailed Revenue Breakdown">
              <div className="p-6">
                <Table
                  columns={[
                    { key: "period", header: "Period" },
                    {
                      key: "revenue",
                      header: "Revenue",
                      render: (item) => (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ${item.revenue.toLocaleString()}
                        </span>
                      ),
                    },
                    { key: "events", header: "Events" },
                    {
                      key: "attendees",
                      header: "Attendees",
                      render: (item) => item.attendees.toLocaleString(),
                    },
                    {
                      key: "avgRevenue",
                      header: "Avg Revenue/Event",
                      render: (item) => (
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          ${(item.revenue / item.events).toFixed(0)}
                        </span>
                      ),
                    },
                  ]}
                  data={mockRevenueData}
                />
              </div>
            </Card>
          </div>
        );

      case "utilization":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Hall Utilization Report
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleExport("utilization", "pdf")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Occupancy Rates">
                <div className="p-6">
                  <BarChart
                    data={mockHallUtilization.map((h) => ({
                      name: h.hallName,
                      occupancyRate: h.occupancyRate,
                    }))}
                    dataKeys={["occupancyRate"]}
                    colors={["#F59E0B"]}
                  />
                </div>
              </Card>

              <Card title="Revenue by Hall">
                <div className="p-6">
                  <PieChartComponent
                    data={mockHallUtilization.map((h) => ({
                      name: h.hallName,
                      value: h.revenue,
                    }))}
                  />
                </div>
              </Card>
            </div>

            <Card title="Hall Performance Details">
              <div className="p-6">
                <Table
                  columns={[
                    { key: "hallName", header: "Hall Name" },
                    {
                      key: "occupancyRate",
                      header: "Occupancy Rate",
                      render: (hall) => (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}
                          >
                            <div
                              className={`h-full ${
                                hall.occupancyRate >= 70
                                  ? "bg-green-500"
                                  : hall.occupancyRate >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${hall.occupancyRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {hall.occupancyRate}%
                          </span>
                        </div>
                      ),
                    },
                    { key: "totalBookings", header: "Total Bookings" },
                    {
                      key: "revenue",
                      header: "Revenue",
                      render: (hall) => (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ${hall.revenue.toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "maintenanceHours",
                      header: "Maintenance Hours",
                      render: (hall) => (
                        <span
                          className={`font-medium ${
                            hall.maintenanceHours > 8
                              ? "text-red-600"
                              : "text-gray-600"
                          } dark:text-gray-400`}
                        >
                          {hall.maintenanceHours}h
                        </span>
                      ),
                    },
                  ]}
                  data={mockHallUtilization}
                />
              </div>
            </Card>
          </div>
        );

      case "attendance":
        const attendanceData = mockEvents
          .map((event) => ({
            eventName: event.name,
            expectedAttendees: event.expectedAttendees || 0,
            actualAttendees:
              event.actualAttendees ||
              Math.floor(
                (event.expectedAttendees || 0) * (0.8 + Math.random() * 0.3)
              ),
            attendanceRate: 0,
          }))
          .map((data) => ({
            ...data,
            attendanceRate: Math.round(
              (data.actualAttendees / data.expectedAttendees) * 100
            ),
          }));

        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Event Attendance Report
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleExport("attendance", "pdf")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            <Card title="Attendance vs Expected">
              <div className="p-6">
                <Table
                  columns={[
                    { key: "eventName", header: "Event Name" },
                    {
                      key: "expectedAttendees",
                      header: "Expected Attendees",
                      render: (data) => data.expectedAttendees.toLocaleString(),
                    },
                    {
                      key: "actualAttendees",
                      header: "Actual Attendees",
                      render: (data) => data.actualAttendees.toLocaleString(),
                    },
                    {
                      key: "attendanceRate",
                      header: "Attendance Rate",
                      render: (data) => (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}
                          >
                            <div
                              className={`h-full ${
                                data.attendanceRate >= 90
                                  ? "bg-green-500"
                                  : data.attendanceRate >= 70
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(data.attendanceRate, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {data.attendanceRate}%
                          </span>
                        </div>
                      ),
                    },
                  ]}
                  data={attendanceData}
                />
              </div>
            </Card>
          </div>
        );

      case "packages":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Package Performance Report
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleExport("packages", "pdf")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Package Revenue Distribution">
                <div className="p-6">
                  <PieChartComponent
                    data={mockPackagePerformance.map((p) => ({
                      name: p.packageName,
                      value: p.revenue,
                    }))}
                  />
                </div>
              </Card>

              <Card title="Bookings by Package">
                <div className="p-6">
                  <BarChart
                    data={mockPackagePerformance.map((p) => ({
                      name: p.packageName.split(" ")[0],
                      bookings: p.bookings,
                    }))}
                    dataKeys={["bookings"]}
                    colors={["#8B5CF6"]}
                  />
                </div>
              </Card>
            </div>

            <Card title="Package Performance Details">
              <div className="p-6">
                <Table
                  columns={[
                    { key: "packageName", header: "Package Name" },
                    { key: "bookings", header: "Bookings" },
                    {
                      key: "revenue",
                      header: "Revenue",
                      render: (pkg) => (
                        <span className="font-medium text-green-600 dark:text-green-400">
                          ${pkg.revenue.toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "averagePrice",
                      header: "Average Price",
                      render: (pkg) => (
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          ${pkg.averagePrice.toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "performance",
                      header: "Performance",
                      render: (pkg) => (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pkg.bookings >= 10
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : pkg.bookings >= 5
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {pkg.bookings >= 10
                            ? "High"
                            : pkg.bookings >= 5
                            ? "Medium"
                            : "Low"}
                        </span>
                      ),
                    },
                  ]}
                  data={mockPackagePerformance}
                />
              </div>
            </Card>
          </div>
        );

      case "cancellations":
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Cancellation Report
              </h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleExport("cancellations", "pdf")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>

            <Card title="Cancellations by Month">
              <div className="p-6">
                <Table
                  columns={[
                    { key: "month", header: "Month" },
                    { key: "cancellations", header: "Cancellations" },
                    { key: "reason", header: "Primary Reason" },
                    {
                      key: "refundAmount",
                      header: "Refund Amount",
                      render: (data) => (
                        <span className="font-medium text-red-600 dark:text-red-400">
                          ${data.refundAmount.toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "impact",
                      header: "Impact",
                      render: (data) => (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            data.refundAmount >= 5000
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {data.refundAmount >= 5000 ? "High" : "Medium"}
                        </span>
                      ),
                    },
                  ]}
                  data={mockCancellationData}
                />
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
            Event Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive reporting and analytics for event management
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 border-0 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Revenue</p>
                <p className="text-3xl font-bold text-white">
                  ${summaryMetrics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-white opacity-80" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 border-0 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Events</p>
                <p className="text-3xl font-bold text-white">
                  {summaryMetrics.totalEvents}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-white opacity-80" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 border-0 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Attendees</p>
                <p className="text-3xl font-bold text-white">
                  {summaryMetrics.totalAttendees.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-white opacity-80" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 border-0 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Revenue/Event</p>
                <p className="text-3xl font-bold text-white">
                  ${summaryMetrics.averageRevenuePerEvent}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-white opacity-80" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Report Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
            />
            <Select
              label="Event Type"
              value={filters.eventType}
              onChange={(e) => handleFilterChange("eventType", e.target.value)}
              options={[
                { value: "all", label: "All Types" },
                { value: "conference", label: "Conference" },
                { value: "wedding", label: "Wedding" },
                { value: "corporate", label: "Corporate" },
                { value: "gala", label: "Gala" },
              ]}
            />
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              options={[
                { value: "all", label: "All Status" },
                { value: "confirmed", label: "Confirmed" },
                { value: "completed", label: "Completed" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
            <Select
              label="Hall"
              value={filters.hallId}
              onChange={(e) => handleFilterChange("hallId", e.target.value)}
              options={[
                { value: "all", label: "All Halls" },
                ...mockHalls.map((hall) => ({
                  value: hall.id,
                  label: hall.name,
                })),
              ]}
            />
            <Select
              label="Package"
              value={filters.packageId}
              onChange={(e) => handleFilterChange("packageId", e.target.value)}
              options={[
                { value: "all", label: "All Packages" },
                ...mockPackages.map((pkg) => ({
                  value: pkg.id,
                  label: pkg.name,
                })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Report Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: "revenue", label: "Revenue Report", icon: DollarSign },
          { id: "utilization", label: "Hall Utilization", icon: Building2 },
          { id: "attendance", label: "Attendance", icon: Users },
          { id: "packages", label: "Package Performance", icon: BarChart3 },
          { id: "cancellations", label: "Cancellations", icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeReport === id ? "primary" : "secondary"}
            onClick={() => setActiveReport(id)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Icon className="w-4 h-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Report Content */}
      <div>{renderReportContent()}</div>
    </div>
  );
};
