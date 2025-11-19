import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import {
  Sparkles,
  ClipboardCheck,
  Trash2,
  BedDouble,
  Bath,
  Droplets,
  Droplet,
  PlugZap,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DoorOpen,
  Edit3,
  Phone,
  Mail,
  ArrowLeft,
  Hand,
  Wine,
  ListChecks,
  Square,
  Send,
  MessageSquare,
  History,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

type RoomStatus = "checkout" | "inCleaning" | "assigned" | "available";
type ActivityId =
  | "pick-trash"
  | "change-beds"
  | "restock-amenities"
  | "clean-bathroom"
  | "vacuum-floor"
  | "replace-towels"
  | "mop-floor"
  | "sanitize"
  | "check-minibar"
  | "check-electricals"
  | "replace-water"
  | "final-inspection"
  | "clean-mirror"
  | "scrub-toilet"
  | "clean-sink"
  | "clean-shower";

type ActivityCategory = string;

interface Activity {
  id: ActivityId;
  label: string;
  icon: React.ElementType;
  completed: boolean;
  category: ActivityCategory;
}

interface Room {
  id: string;
  number: string;
  type: string;
  floor: number;
  status: RoomStatus;
  assignedTo?: string;
  activities: Activity[];
  startTime?: number; // Timestamp when cleaning started
}

interface CleaningMessage {
  id: string;
  roomNumber: string;
  cleanerName: string;
  timeSpent: string;
  note?: string;
  timestamp: number;
}

interface HousekeeperProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  nic: string;
  address: string;
  active: boolean;
}

interface CleaningHistoryRecord {
  id: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  cleaningDate: string; // YYYY-MM-DD
  startTime: number; // timestamp
  endTime: number; // timestamp
  duration: number; // seconds
  status: "completed";
  completedTasks: Activity[]; // snapshot of completed activities
  housekeeperId: string;
  housekeeperName: string;
}

const activityDefinitionsDefaults: Omit<Activity, "completed">[] = [
  // Washroom Activities
  {
    id: "clean-mirror",
    label: "Clean Mirror",
    icon: Square,
    category: "washroom",
  },
  {
    id: "scrub-toilet",
    label: "Scrub Toilet",
    icon: Bath,
    category: "washroom",
  },
  {
    id: "clean-sink",
    label: "Clean Sink",
    icon: Droplets,
    category: "washroom",
  },
  {
    id: "clean-shower",
    label: "Clean Shower/Bathtub",
    icon: Bath,
    category: "washroom",
  },
  {
    id: "replace-towels",
    label: "Replace Towels",
    icon: Droplets,
    category: "washroom",
  },
  {
    id: "sanitize",
    label: "Sanitize Surfaces",
    icon: ShieldCheck,
    category: "washroom",
  },
  // Bedroom Activities
  {
    id: "change-beds",
    label: "Change Bed Sheets",
    icon: BedDouble,
    category: "bedroom",
  },
  {
    id: "vacuum-floor",
    label: "Vacuum Floor",
    icon: Sparkles,
    category: "bedroom",
  },
  {
    id: "pick-trash",
    label: "Pick Up Trash",
    icon: Trash2,
    category: "bedroom",
  },
  {
    id: "restock-amenities",
    label: "Restock Amenities",
    icon: Hand,
    category: "bedroom",
  },
  {
    id: "check-minibar",
    label: "Check Mini-Bar",
    icon: Wine,
    category: "bedroom",
  },
  {
    id: "check-electricals",
    label: "Check Electricals",
    icon: PlugZap,
    category: "bedroom",
  },
  {
    id: "replace-water",
    label: "Replace Water Bottles",
    icon: Droplet,
    category: "bedroom",
  },
  {
    id: "final-inspection",
    label: "Final Inspection",
    icon: ClipboardCheck,
    category: "bedroom",
  },
];

// Build default cleaning tasks map from activityDefinitionsDefaults
const defaultCleaningTasks: Record<string, string[]> =
  activityDefinitionsDefaults.reduce((acc, def) => {
    const key = def.category;
    acc[key] = acc[key] || [];
    acc[key].push(def.label);
    return acc;
  }, {} as Record<string, string[]>);

const createRoomActivities = (
  definitions: Omit<Activity, "completed">[] = activityDefinitionsDefaults
): Activity[] => definitions.map((def) => ({ ...def, completed: false }));

const initialHousekeepers: HousekeeperProfile[] = [
  {
    id: "hk-1",
    name: "Maria Garcia",
    phone: "12025550147",
    email: "maria@hotel.com",
    nic: "123456789V",
    address: "123 Main Street, Colombo 05",
    active: true,
  },
  {
    id: "hk-2",
    name: "Ahmed Hassan",
    phone: "12025550120",
    email: "ahmed@hotel.com",
    nic: "200145601234",
    address: "456 Park Avenue, Kandy",
    active: true,
  },
  {
    id: "hk-3",
    name: "Sofia Rodriguez",
    phone: "12025550170",
    email: "sofia@hotel.com",
    nic: "987654321X",
    address: "789 Beach Road, Galle",
    active: false,
  },
];

const initialRooms: Room[] = [
  {
    id: "r-101",
    number: "101",
    type: "Deluxe King",
    floor: 10,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-102",
    number: "102",
    type: "Garden Suite",
    floor: 10,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-103",
    number: "103",
    type: "Standard Twin",
    floor: 10,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-104",
    number: "104",
    type: "Deluxe Queen",
    floor: 10,
    status: "assigned",
    assignedTo: "Sofia Rodriguez",
    activities: createRoomActivities(),
  },
  {
    id: "r-105",
    number: "105",
    type: "Ocean View",
    floor: 10,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-201",
    number: "201",
    type: "Executive Suite",
    floor: 20,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-202",
    number: "202",
    type: "Family Room",
    floor: 20,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-203",
    number: "203",
    type: "Executive Twin",
    floor: 20,
    status: "inCleaning",
    assignedTo: "Maria Garcia",
    activities: createRoomActivities(),
  },
  {
    id: "r-204",
    number: "204",
    type: "Deluxe King",
    floor: 20,
    status: "available",
    activities: createRoomActivities(),
  },
  {
    id: "r-215",
    number: "215",
    type: "Spa Suite",
    floor: 21,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-301",
    number: "301",
    type: "Presidential Suite",
    floor: 30,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-302",
    number: "302",
    type: "Premium King",
    floor: 30,
    status: "assigned",
    assignedTo: "Ahmed Hassan",
    activities: createRoomActivities(),
  },
  {
    id: "r-308",
    number: "308",
    type: "Panorama Suite",
    floor: 30,
    status: "inCleaning",
    assignedTo: "Ahmed Hassan",
    activities: createRoomActivities(),
  },
  {
    id: "r-310",
    number: "310",
    type: "Deluxe Twin",
    floor: 30,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-401",
    number: "401",
    type: "Penthouse Suite",
    floor: 40,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-405",
    number: "405",
    type: "Business Suite",
    floor: 40,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-407",
    number: "407",
    type: "Premium King",
    floor: 40,
    status: "available",
    activities: createRoomActivities(),
  },
  {
    id: "r-408",
    number: "408",
    type: "Deluxe Queen",
    floor: 40,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-501",
    number: "501",
    type: "Luxury Suite",
    floor: 50,
    status: "checkout",
    activities: createRoomActivities(),
  },
  {
    id: "r-502",
    number: "502",
    type: "Executive King",
    floor: 50,
    status: "assigned",
    assignedTo: "Maria Garcia",
    activities: createRoomActivities(),
  },
];

interface HousekeepingProps {
  mode: "manager" | "housekeeper";
}

export const Housekeeping: React.FC<HousekeepingProps> = ({ mode }) => {
  const [rooms, setRooms] = useState<Room[]>(initialRooms);

  // Load cleaning categories/tasks created by manager (persisted in CleaningTaskList)
  const [cleaningTasks, setCleaningTasks] = useState<Record<string, string[]>>(
    () => {
      try {
        const saved = localStorage.getItem("cleaning_task_list");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
      return defaultCleaningTasks;
    }
  );

  // Ensure rooms include activities for any manager-added categories
  useEffect(() => {
    setRooms((prevRooms) =>
      prevRooms.map((room) => {
        const existingLabels = new Set(room.activities.map((a) => a.label));
        const merged = [...room.activities];
        Object.keys(cleaningTasks).forEach((category) => {
          cleaningTasks[category].forEach((label) => {
            if (!existingLabels.has(label)) {
              // create a simple activity id from label
              const id = (label.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
                `act-${Date.now()}`) as ActivityId;
              merged.push({
                id,
                label,
                icon: Square,
                category,
                completed: false,
              });
              existingLabels.add(label);
            }
          });
        });
        return { ...room, activities: merged };
      })
    );
  }, [cleaningTasks]);

  // Listen for storage updates so manager changes reflect for housekeeper in other tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "cleaning_task_list") {
        try {
          const parsed = e.newValue
            ? JSON.parse(e.newValue)
            : defaultCleaningTasks;
          setCleaningTasks(parsed);
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener("storage", handler);
    const localHandler = (ev: Event) => {
      try {
        // @ts-ignore -- CustomEvent detail
        const parsed =
          (ev as CustomEvent).detail ||
          JSON.parse(localStorage.getItem("cleaning_task_list") || "{}");
        setCleaningTasks(parsed);
      } catch (err) {}
    };
    window.addEventListener(
      "cleaning_tasks_updated",
      localHandler as EventListener
    );
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(
        "cleaning_tasks_updated",
        localHandler as EventListener
      );
    };
  }, []);

  // Category scroll controls
  const catScrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateCatNav = () => {
    const el = catScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 1);
  };

  const scrollCategories = (delta: number) => {
    const el = catScrollRef.current;
    if (el) {
      el.scrollBy({ left: delta, behavior: "smooth" });
      setTimeout(updateCatNav, 300);
    }
  };

  useEffect(() => {
    updateCatNav();
    const el = catScrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateCatNav);
      return () => el.removeEventListener("scroll", updateCatNav);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [housekeepers, setHousekeepers] =
    useState<HousekeeperProfile[]>(initialHousekeepers);
  const navigate = useNavigate();
  const { hideSidebar, showSidebar } = useSidebar();

  // Housekeeper states
  const [housekeeperStage, setHousekeeperStage] = useState<
    "dashboard" | "selected" | "activities" | "history"
  >("dashboard");
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [, setTotalCleaningTimer] = useState<number>(0); // Total cleaning duration in seconds
  const [cleaningSessionStartTime, setCleaningSessionStartTime] = useState<
    number | null
  >(null); // When cleaning session started
  const [messages, setMessages] = useState<CleaningMessage[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageRoomId, setMessageRoomId] = useState<string | null>(null);
  const [messageNote, setMessageNote] = useState("");
  const [currentCleanerName] = useState("Housekeeper"); // In real app, get from auth context
  const [currentCleanerId] = useState("hk-1"); // In real app, get from auth context
  const [activeActivityView, setActiveActivityView] = useState<
    Record<string, string | null>
  >({}); // Room ID -> active activity view
  const [cleaningHistory, setCleaningHistory] = useState<
    CleaningHistoryRecord[]
  >([]);
  const [showHistoryDetailsModal, setShowHistoryDetailsModal] = useState(false);
  const [selectedHistoryRecord, setSelectedHistoryRecord] =
    useState<CleaningHistoryRecord | null>(null);
  const [historyDetailsActiveTab, setHistoryDetailsActiveTab] = useState<
    "kitchen" | "living" | "bedroom" | "bathroom" | "general"
  >("bedroom");

  // Compute tasks by category for history details
  const historyTasksByCategory = useMemo(() => {
    if (!selectedHistoryRecord) return null;
    return {
      kitchen: selectedHistoryRecord.completedTasks.filter(
        (t) => categorizeTask(t.id) === "kitchen"
      ),
      living: selectedHistoryRecord.completedTasks.filter(
        (t) => categorizeTask(t.id) === "living"
      ),
      bedroom: selectedHistoryRecord.completedTasks.filter(
        (t) => categorizeTask(t.id) === "bedroom"
      ),
      bathroom: selectedHistoryRecord.completedTasks.filter(
        (t) => categorizeTask(t.id) === "bathroom"
      ),
      general: selectedHistoryRecord.completedTasks.filter(
        (t) => categorizeTask(t.id) === "general"
      ),
    };
  }, [selectedHistoryRecord]);

  const historyTabs = useMemo(() => {
    if (!historyTasksByCategory) return [];
    return [
      {
        id: "kitchen" as const,
        label: "Kitchen Tasks",
        count: historyTasksByCategory.kitchen.length,
      },
      {
        id: "living" as const,
        label: "Living Area Tasks",
        count: historyTasksByCategory.living.length,
      },
      {
        id: "bedroom" as const,
        label: "Bedroom Tasks",
        count: historyTasksByCategory.bedroom.length,
      },
      {
        id: "bathroom" as const,
        label: "Bathroom Tasks",
        count: historyTasksByCategory.bathroom.length,
      },
      {
        id: "general" as const,
        label: "General Tasks",
        count: historyTasksByCategory.general.length,
      },
    ];
  }, [historyTasksByCategory]);

  useEffect(() => {
    if (mode !== "housekeeper") {
      showSidebar();
      return;
    }

    if (housekeeperStage === "activities") {
      hideSidebar();
    } else {
      showSidebar();
    }
  }, [mode, housekeeperStage, hideSidebar, showSidebar]);

  useEffect(() => {
    return () => {
      showSidebar();
    };
  }, [showSidebar]);

  // Manager states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] =
    useState<HousekeeperProfile | null>(null);
  const [profileForm, setProfileForm] = useState<
    Omit<HousekeeperProfile, "id">
  >({
    name: "",
    phone: "",
    email: "",
    nic: "",
    address: "",
    active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedHousekeeperId, setSelectedHousekeeperId] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [rejectedHousekeeperId, setRejectedHousekeeperId] = useState<
    string | null
  >(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignData, setReassignData] = useState<{
    roomId: string;
    fromCleanerId: string;
  } | null>(null);
  const [showHousekeeperSelectModal, setShowHousekeeperSelectModal] =
    useState(false);
  const [isReassignment, setIsReassignment] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCleanerForHistory, setSelectedCleanerForHistory] = useState<
    string | null
  >(null);
  const [roomHistory, setRoomHistory] = useState<
    Record<
      string,
      Array<{
        roomNumber: string;
        assignedBy: "manager" | "housekeeper";
        timestamp: number;
      }>
    >
  >({}); // cleanerId -> room history array

  // Search states
  const [managerRoomSearch, setManagerRoomSearch] = useState(""); // For manager: search by room number
  const [housekeeperFloorSearch, setHousekeeperFloorSearch] = useState(""); // For housekeeper: search by floor number

  const checkoutRooms = useMemo(() => {
    const filtered = rooms.filter((r) => r.status === "checkout");
    // Filter by floor number if search is active (housekeeper view)
    if (mode === "housekeeper" && housekeeperFloorSearch) {
      const floorNum = parseInt(housekeeperFloorSearch);
      if (!isNaN(floorNum)) {
        return filtered.filter((r) => r.floor === floorNum);
      }
    }
    return filtered;
  }, [rooms, mode, housekeeperFloorSearch]);
  const inProgressRooms = useMemo(
    () => rooms.filter((r) => r.status === "inCleaning"),
    [rooms]
  );
  const assignedRooms = useMemo(
    () => rooms.filter((r) => r.status === "assigned"),
    [rooms]
  );
  const selectedRooms = useMemo(
    () => rooms.filter((r) => selectedRoomIds.includes(r.id)),
    [rooms, selectedRoomIds]
  );

  // Load data from localStorage on mount - FIX for page loading issue
  useEffect(() => {
    // Load messages
    const savedMessages = localStorage.getItem("housekeeping_messages");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    }

    // Load cleaning session state
    const savedSessionStart = localStorage.getItem(
      "housekeeping_session_start"
    );
    if (savedSessionStart) {
      try {
        const startTime = parseInt(savedSessionStart, 10);
        if (startTime && Date.now() - startTime < 86400000) {
          // Only restore if less than 24 hours old
          setCleaningSessionStartTime(startTime);
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          setTotalCleaningTimer(elapsed);
        }
      } catch (e) {
        console.error("Failed to parse saved session start", e);
      }
    }

    // Load active activity views
    const savedActivityViews = localStorage.getItem(
      "housekeeping_activity_views"
    );
    if (savedActivityViews) {
      try {
        const parsed = JSON.parse(savedActivityViews);
        setActiveActivityView(parsed);
      } catch (e) {
        console.error("Failed to parse saved activity views", e);
      }
    }

    // Load cleaning history
    const savedCleaningHistory = localStorage.getItem(
      "housekeeping_cleaning_history"
    );
    if (savedCleaningHistory) {
      try {
        const parsed = JSON.parse(savedCleaningHistory);
        // Filter by current housekeeper ID
        const filteredHistory = parsed.filter(
          (record: CleaningHistoryRecord) =>
            record.housekeeperId === currentCleanerId
        );
        setCleaningHistory(filteredHistory);
      } catch (e) {
        console.error("Failed to parse saved cleaning history", e);
      }
    }

    // Load room history
    const savedHistory = localStorage.getItem("housekeeping_room_history");
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setRoomHistory(parsed);
      } catch (e) {
        console.error("Failed to parse saved room history", e);
      }
    } else {
      // Initialize with example data for testing
      const exampleHistory: Record<
        string,
        Array<{
          roomNumber: string;
          assignedBy: "manager" | "housekeeper";
          timestamp: number;
        }>
      > = {};

      // Example data for first cleaner (if exists)
      if (initialHousekeepers.length > 0) {
        exampleHistory[initialHousekeepers[0].id] = [
          {
            roomNumber: "101",
            assignedBy: "manager",
            timestamp: Date.now() - 86400000 * 2,
          }, // 2 days ago
          {
            roomNumber: "102",
            assignedBy: "manager",
            timestamp: Date.now() - 86400000,
          }, // 1 day ago
          {
            roomNumber: "103",
            assignedBy: "housekeeper",
            timestamp: Date.now() - 3600000,
          }, // 1 hour ago
          {
            roomNumber: "105",
            assignedBy: "housekeeper",
            timestamp: Date.now() - 1800000,
          }, // 30 min ago
        ];
      }

      // Example data for second cleaner (if exists)
      if (initialHousekeepers.length > 1) {
        exampleHistory[initialHousekeepers[1].id] = [
          {
            roomNumber: "201",
            assignedBy: "manager",
            timestamp: Date.now() - 86400000 * 3,
          }, // 3 days ago
          {
            roomNumber: "202",
            assignedBy: "manager",
            timestamp: Date.now() - 86400000 * 1.5,
          }, // 1.5 days ago
          {
            roomNumber: "204",
            assignedBy: "housekeeper",
            timestamp: Date.now() - 7200000,
          }, // 2 hours ago
        ];
      }

      // Example data for third cleaner (if exists)
      if (initialHousekeepers.length > 2) {
        exampleHistory[initialHousekeepers[2].id] = [
          {
            roomNumber: "301",
            assignedBy: "manager",
            timestamp: Date.now() - 86400000 * 4,
          }, // 4 days ago
          {
            roomNumber: "302",
            assignedBy: "housekeeper",
            timestamp: Date.now() - 5400000,
          }, // 1.5 hours ago
        ];
      }

      if (Object.keys(exampleHistory).length > 0) {
        setRoomHistory(exampleHistory);
        localStorage.setItem(
          "housekeeping_room_history",
          JSON.stringify(exampleHistory)
        );
      }
    }

    // Ensure rooms data is loaded (in real app, this would be an API call)
    // For now, we ensure state is initialized properly
    if (mode === "housekeeper" && rooms.length === 0) {
      // This shouldn't happen with initialRooms, but ensures data is available
      setRooms(initialRooms);
    }
  }, [mode]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("housekeeping_messages", JSON.stringify(messages));
  }, [messages]);

  // Save session start time
  useEffect(() => {
    if (cleaningSessionStartTime) {
      localStorage.setItem(
        "housekeeping_session_start",
        cleaningSessionStartTime.toString()
      );
    } else {
      localStorage.removeItem("housekeeping_session_start");
    }
  }, [cleaningSessionStartTime]);

  // Save activity views
  useEffect(() => {
    localStorage.setItem(
      "housekeeping_activity_views",
      JSON.stringify(activeActivityView)
    );
  }, [activeActivityView]);

  // Save room history
  useEffect(() => {
    localStorage.setItem(
      "housekeeping_room_history",
      JSON.stringify(roomHistory)
    );
  }, [roomHistory]);

  // Save cleaning history
  useEffect(() => {
    // Load all history, merge with current, then save
    const allHistory = JSON.parse(
      localStorage.getItem("housekeeping_cleaning_history") || "[]"
    );
    // Remove old records for this housekeeper and add new ones
    const otherHistory = allHistory.filter(
      (record: CleaningHistoryRecord) =>
        record.housekeeperId !== currentCleanerId
    );
    const updatedHistory = [...otherHistory, ...cleaningHistory];
    localStorage.setItem(
      "housekeeping_cleaning_history",
      JSON.stringify(updatedHistory)
    );
  }, [cleaningHistory, currentCleanerId]);

  // Total Cleaning Duration Timer - counts up from 00:00 when cleaning session starts
  useEffect(() => {
    if (!cleaningSessionStartTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - cleaningSessionStartTime) / 1000
      );
      setTotalCleaningTimer(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [cleaningSessionStartTime]);

  // Check if all selected rooms are completed
  const allRoomsCompleted = useMemo(() => {
    if (selectedRooms.length === 0) return true;
    return selectedRooms.every((room) =>
      room.activities.every((activity) => activity.completed)
    );
  }, [selectedRooms]);

  // Page exit control - prevent leaving until all activities completed
  useEffect(() => {
    if (
      mode === "housekeeper" &&
      housekeeperStage === "activities" &&
      selectedRooms.length > 0 &&
      !allRoomsCompleted
    ) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue =
          "Please complete all selected room cleaning activities before leaving.";
        return e.returnValue;
      };

      const handlePopState = () => {
        if (!allRoomsCompleted) {
          const confirmed = window.confirm(
            "Please complete all selected room cleaning activities before leaving. Are you sure you want to leave?"
          );
          if (!confirmed) {
            window.history.pushState(null, "", window.location.href);
          }
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      window.history.pushState(null, "", window.location.href);
      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [mode, housekeeperStage, selectedRooms.length, allRoomsCompleted]);

  // Navigate to dashboard when all rooms are finished in activities stage
  useEffect(() => {
    if (
      mode === "housekeeper" &&
      housekeeperStage === "activities" &&
      selectedRoomIds.length === 0
    ) {
      setCleaningSessionStartTime(null);
      setTotalCleaningTimer(0);
      setHousekeeperStage("dashboard");
    }
  }, [mode, housekeeperStage, selectedRoomIds.length]);

  // Auto-refresh interval (every 5 seconds) - updates room data without resetting state
  useEffect(() => {
    // Save scroll position before refresh
    const saveScrollPosition = () => {
      sessionStorage.setItem("housekeeping_scroll", window.scrollY.toString());
      sessionStorage.setItem("housekeeping_stage", housekeeperStage);
    };

    const interval = setInterval(() => {
      // In a real app, this would fetch from API
      // For now, we just ensure state persists
      // The timers and selections are already preserved via localStorage
      saveScrollPosition();

      // Trigger a re-render to update UI (without losing state)
      // This simulates auto-refresh behavior
    }, 5000);

    // Restore scroll position after refresh
    const savedScroll = sessionStorage.getItem("housekeeping_scroll");
    const savedStage = sessionStorage.getItem("housekeeping_stage");
    if (savedScroll && savedStage === housekeeperStage) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll, 10));
      }, 100);
    }

    return () => clearInterval(interval);
  }, [housekeeperStage]);

  // Reset state when mode changes to prevent stale UI
  useEffect(() => {
    // Reset housekeeper states
    setHousekeeperStage("dashboard");
    setSelectedRoomIds([]);
    setShowFinishConfirm(false);

    // Reset manager states
    setShowProfileModal(false);
    setEditingProfile(null);
    setProfileForm({
      name: "",
      phone: "",
      email: "",
      nic: "",
      address: "",
      active: true,
    });
    setSelectedRoomId("");
    setSelectedHousekeeperId("");
    setShowConfirmModal(false);
    setShowHousekeeperSelectModal(false);
    setShowSuccessAlert(false);
    setRejectedHousekeeperId(null);
    setShowReassignModal(false);
    setReassignData(null);
    setIsReassignment(false);
    setShowHistoryModal(false);
    setSelectedCleanerForHistory(null);
  }, [mode]);

  // Get active cleaners with their rooms
  const activeCleaners = useMemo(() => {
    const activeCleaning = [...inProgressRooms, ...assignedRooms];
    const cleanerMap = new Map<string, Room[]>();

    activeCleaning.forEach((room) => {
      if (room.assignedTo) {
        const existing = cleanerMap.get(room.assignedTo) || [];
        cleanerMap.set(room.assignedTo, [...existing, room]);
      }
    });

    return Array.from(cleanerMap.entries()).map(([name, roomList]) => ({
      name,
      rooms: roomList,
      profile: housekeepers.find((hk) => hk.name === name),
    }));
  }, [inProgressRooms, assignedRooms, housekeepers]);

  // Get progress for a cleaner's rooms
  const getCleanerProgress = (cleanerId: string | undefined) => {
    if (!cleanerId) return { completed: 0, total: 0, percentage: 0 };

    const cleaner = housekeepers.find((hk) => hk.id === cleanerId);
    if (!cleaner) return { completed: 0, total: 0, percentage: 0 };

    const cleanerRooms = [...inProgressRooms, ...assignedRooms].filter(
      (r) => r.assignedTo === cleaner.name
    );

    const totalActivities = cleanerRooms.reduce(
      (acc, room) => acc + room.activities.length,
      0
    );
    const completedActivities = cleanerRooms.reduce(
      (acc, room) => acc + room.activities.filter((a) => a.completed).length,
      0
    );

    return {
      completed: completedActivities,
      total: totalActivities,
      percentage:
        totalActivities > 0
          ? Math.round((completedActivities / totalActivities) * 100)
          : 0,
    };
  };

  // Validation functions
  const validateNIC = (nic: string): boolean => {
    if (!nic.trim()) return false;
    // Old format: 9 digits + 1 letter (e.g., 123456789V)
    // New format: 12 digits (e.g., 200145601234)
    const oldFormat = /^[0-9]{9}[VXvx]$/;
    const newFormat = /^[0-9]{12}$/;
    return oldFormat.test(nic) || newFormat.test(nic);
  };

  const validateEmail = (email: string): boolean => {
    if (!email.trim()) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!profileForm.name.trim()) {
      errors.name = "Name is required";
    }

    // Phone validation
    if (!profileForm.phone.trim()) {
      errors.phone = "Phone is required";
    } else if (!/^\d+$/.test(profileForm.phone)) {
      errors.phone = "Phone must contain only numbers";
    }

    // Email validation
    if (profileForm.email.trim() && !validateEmail(profileForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    // NIC validation
    if (!profileForm.nic.trim()) {
      errors.nic = "NIC is required";
    } else if (!validateNIC(profileForm.nic)) {
      errors.nic =
        "Please enter a valid NIC (e.g., 123456789V or 200145601234)";
    }

    // Address validation
    if (!profileForm.address.trim()) {
      errors.address = "Address is required";
    } else if (profileForm.address.trim().length < 5) {
      errors.address = "Address must be at least 5 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manager CRUD
  const openCreateProfile = () => {
    setEditingProfile(null);
    setProfileForm({
      name: "",
      phone: "",
      email: "",
      nic: "",
      address: "",
      active: true,
    });
    setFormErrors({});
    setShowProfileModal(true);
  };

  const openEditProfile = (profile: HousekeeperProfile) => {
    setEditingProfile(profile);
    setProfileForm({
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      nic: profile.nic || "",
      address: profile.address || "",
      active: profile.active,
    });
    setFormErrors({});
    setShowProfileModal(true);
  };

  const handleSaveProfile = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (editingProfile) {
        setHousekeepers((prev) =>
          prev.map((hk) =>
            hk.id === editingProfile.id
              ? { ...editingProfile, ...profileForm }
              : hk
          )
        );
      } else {
        setHousekeepers((prev) => [
          ...prev,
          {
            id: `hk-${prev.length + 1}`,
            ...profileForm,
          },
        ]);
      }
      setShowProfileModal(false);
      setFormErrors({});
    } catch (error) {
      console.error("Error saving housekeeper:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = (id: string) => {
    setHousekeepers((prev) => prev.filter((hk) => hk.id !== id));
    setRooms((prev) =>
      prev.map((room) =>
        room.assignedTo === housekeepers.find((hk) => hk.id === id)?.name
          ? { ...room, status: "checkout", assignedTo: undefined }
          : room
      )
    );
  };

  // Add room to cleaner's history
  const addRoomToHistory = (
    cleanerId: string,
    roomNumber: string,
    assignedBy: "manager" | "housekeeper" = "manager"
  ) => {
    setRoomHistory((prev) => {
      const cleanerHistory = prev[cleanerId] || [];
      // Check if room already exists in history for this cleaner
      const exists = cleanerHistory.some(
        (entry) => entry.roomNumber === roomNumber
      );
      if (!exists) {
        return {
          ...prev,
          [cleanerId]: [
            ...cleanerHistory,
            { roomNumber, assignedBy, timestamp: Date.now() },
          ],
        };
      }
      return prev;
    });
  };

  // Open history modal for a cleaner
  const handleOpenHistory = (cleanerId: string) => {
    setSelectedCleanerForHistory(cleanerId);
    setShowHistoryModal(true);
  };

  // Manager Assignment
  const handleAssignClick = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedHousekeeperId("");
    setShowHousekeeperSelectModal(true);
  };

  const handleHousekeeperSelect = (housekeeperId: string) => {
    setSelectedHousekeeperId(housekeeperId);
    setShowHousekeeperSelectModal(false);
    setShowConfirmModal(true);
  };

  const confirmAssignment = () => {
    if (!selectedRoomId || !selectedHousekeeperId) return;
    setShowConfirmModal(true);
  };

  const handleAssignment = (confirmed: boolean) => {
    const housekeeper = housekeepers.find(
      (hk) => hk.id === selectedHousekeeperId
    );
    if (!housekeeper) return;

    if (confirmed) {
      // Cleaner said YES
      const room = rooms.find((r) => r.id === selectedRoomId);
      if (isReassignment && reassignData) {
        // Handle reassignment - update the room's assignedTo
        setRooms((prev) =>
          prev.map((room) =>
            room.id === selectedRoomId
              ? { ...room, assignedTo: housekeeper.name }
              : room
          )
        );
        // Add to history
        if (room) {
          addRoomToHistory(selectedHousekeeperId, room.number);
        }
        setReassignData(null);
      } else {
        // Handle initial assignment - set status to assigned
        setRooms((prev) =>
          prev.map((room) =>
            room.id === selectedRoomId
              ? { ...room, status: "assigned", assignedTo: housekeeper.name }
              : room
          )
        );
        // Add to history
        if (room) {
          addRoomToHistory(selectedHousekeeperId, room.number);
        }
      }
      setSelectedRoomId("");
      setSelectedHousekeeperId("");
      setShowConfirmModal(false);
      setIsReassignment(false);
      setShowSuccessAlert(true);
      setRejectedHousekeeperId(null);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 1500);
    } else {
      // Cleaner said NO
      if (isReassignment) {
        // If it's a reassignment and cleaner says NO, close modal and reset
        setShowConfirmModal(false);
        setIsReassignment(false);
        setReassignData(null);
        setSelectedRoomId("");
        setSelectedHousekeeperId("");
      } else {
        // Initial assignment - cleaner said NO
        setRejectedHousekeeperId(selectedHousekeeperId);
        setShowConfirmModal(false);
        // Room remains in checkout status (waiting for cleaning)
        // Manager can now reassign to another cleaner
      }
    }
  };

  const handleReassign = (newHousekeeperId: string) => {
    if (!selectedRoomId || !rejectedHousekeeperId) return;

    const newHousekeeper = housekeepers.find(
      (hk) => hk.id === newHousekeeperId
    );
    const oldHousekeeper = housekeepers.find(
      (hk) => hk.id === rejectedHousekeeperId
    );

    if (!newHousekeeper || !oldHousekeeper) return;

    // Remove from old cleaner and assign to new cleaner
    setRooms((prev) =>
      prev.map((room) =>
        room.id === selectedRoomId
          ? { ...room, status: "assigned", assignedTo: newHousekeeper.name }
          : room
      )
    );

    setSelectedRoomId("");
    setSelectedHousekeeperId("");
    setRejectedHousekeeperId(null);
    setShowSuccessAlert(true);
    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 1500);
  };

  // Reassign room during active cleaning
  const handleReassignActiveCleaning = (newHousekeeperId: string) => {
    if (!reassignData) return;

    const newHousekeeper = housekeepers.find(
      (hk) => hk.id === newHousekeeperId
    );
    if (!newHousekeeper) return;

    // Set the selected room and housekeeper, then show confirmation modal
    setSelectedRoomId(reassignData.roomId);
    setSelectedHousekeeperId(newHousekeeperId);
    setIsReassignment(true);
    setShowReassignModal(false);
    setShowConfirmModal(true);
  };

  // Housekeeper Selection
  const toggleSelectedRoom = (roomId: string) => {
    setSelectedRoomIds((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleProceed = () => {
    if (selectedRoomIds.length >= 1) {
      const now = Date.now();
      // Start total cleaning timer if not already started
      if (!cleaningSessionStartTime) {
        setCleaningSessionStartTime(now);
        setTotalCleaningTimer(0);
      }

      // Add selected rooms to history for current housekeeper (housekeeper self-selected)
      selectedRoomIds.forEach((roomId) => {
        const room = rooms.find((r) => r.id === roomId);
        if (room) {
          // Find housekeeper by name (currentCleanerName) or use first active
          const cleaner =
            housekeepers.find((hk) => hk.name === currentCleanerName) ||
            housekeepers.find((hk) => hk.active);
          if (cleaner) {
            addRoomToHistory(cleaner.id, room.number, "housekeeper");
            // Also update room assignment if not already assigned
            if (!room.assignedTo) {
              setRooms((prev) =>
                prev.map((r) =>
                  r.id === roomId ? { ...r, assignedTo: cleaner.name } : r
                )
              );
            }
          }
        }
      });

      // Allow 1 or more rooms to proceed
      setHousekeeperStage("activities");
      setRooms((prev) =>
        prev.map((room) => {
          if (selectedRoomIds.includes(room.id)) {
            return {
              ...room,
              status: "inCleaning",
              startTime: room.startTime || now,
            };
          }
          return room;
        })
      );
    }
  };

  // Cancel room before cleaning starts (no penalty, no message)
  const handleCancelRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room || room.status === "inCleaning") {
      // If cleaning has started, use removal logic instead
      handleRemoveRoom(roomId);
      return;
    }

    // Simple cancellation - just remove from selection
    setSelectedRoomIds((prev) => prev.filter((id) => id !== roomId));
  };

  // Remove room during cleaning (sends message to manager)
  const handleRemoveRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // Calculate time spent on this room
    const timeSpent = room.startTime
      ? Math.floor((Date.now() - room.startTime) / 1000)
      : 0;

    // Create removal request message
    const removalMessage: CleaningMessage = {
      id: `removal-${Date.now()}`,
      roomNumber: room.number,
      cleanerName: currentCleanerName,
      timeSpent: formatTime(timeSpent),
      note: "Unable to finish this room",
      timestamp: Date.now(),
    };

    // Add to messages
    setMessages((prev) => [...prev, removalMessage]);

    // Remove room from selection and update status
    setSelectedRoomIds((prev) => prev.filter((id) => id !== roomId));
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status: "checkout",
              startTime: undefined,
              assignedTo: undefined,
            }
          : r
      )
    );

    // Clear activity view for this room
    setActiveActivityView((prev) => {
      const updated = { ...prev };
      delete updated[roomId];
      return updated;
    });
  };

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Format time as HH:MM:SS for longer durations
  const formatTimeLong = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to categorize tasks
  const categorizeTask = (
    activityId: ActivityId
  ): "kitchen" | "living" | "bedroom" | "bathroom" | "general" => {
    const taskMap: Partial<
      Record<
        ActivityId,
        "kitchen" | "living" | "bedroom" | "bathroom" | "general"
      >
    > = {
      "check-minibar": "kitchen",
      "vacuum-floor": "living",
      "change-beds": "bedroom",
      "pick-trash": "bedroom",
      "restock-amenities": "bedroom",
      "replace-water": "bedroom",
      "clean-mirror": "bathroom",
      "scrub-toilet": "bathroom",
      "clean-sink": "bathroom",
      "clean-shower": "bathroom",
      "replace-towels": "bathroom",
      sanitize: "bathroom",
      "clean-bathroom": "bathroom",
      "mop-floor": "living",
      "check-electricals": "general",
      "final-inspection": "general",
    };
    return taskMap[activityId] || "general";
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format date as dd-mm-yyyy
  const formatDateDDMMYYYY = (timestamp: number): string => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format time for display (HH:MM AM/PM)
  const formatTimeDisplay = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle view history details (Future feature - currently unused)
  // const handleViewHistoryDetails = (record: CleaningHistoryRecord) => {
  //   setSelectedHistoryRecord(record);
  //   setHistoryDetailsActiveTab("bedroom"); // Reset to default tab
  //   setShowHistoryDetailsModal(true);
  // };

  // Send message to dashboard (for room removal)
  const handleSendMessage = () => {
    if (!messageRoomId) return;
    const room = rooms.find((r) => r.id === messageRoomId);
    if (!room) return;

    const timeSpent = room.startTime
      ? formatTime(Math.floor((Date.now() - room.startTime) / 1000))
      : formatTime(0);

    const newMessage: CleaningMessage = {
      id: `msg-${Date.now()}`,
      roomNumber: room.number,
      cleanerName: currentCleanerName,
      timeSpent,
      note: messageNote || "Unable to finish this room",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Also remove the room
    handleRemoveRoom(messageRoomId);

    setShowMessageModal(false);
    setMessageRoomId(null);
    setMessageNote("");
  };

  // Toggle activity view for a room (supports dynamic categories)
  const toggleActivityView = (roomId: string, category: string) => {
    setActiveActivityView((prev) => {
      const current = prev[roomId];
      // If clicking the same category, hide it. Otherwise, show the clicked category
      return {
        ...prev,
        [roomId]: current === category ? null : category,
      };
    });
  };

  const handleStartCleaning = (roomId: string) => {
    setHousekeeperStage("activities");
    setRooms((prev) =>
      prev.map((room) =>
        room.id === roomId ? { ...room, status: "inCleaning" } : room
      )
    );
  };

  const toggleActivity = (activityId: ActivityId, roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // Find the index of the clicked activity
    const activityIndex = room.activities.findIndex(
      (act) => act.id === activityId
    );
    if (activityIndex === -1) return;

    // Check if all previous activities in the same category are completed
    const category = room.activities[activityIndex].category;
    const categoryActivities = room.activities.filter(
      (act) => act.category === category
    );
    const currentCategoryIndex = categoryActivities.findIndex(
      (act) => act.id === activityId
    );
    const previousCategoryActivities = categoryActivities.slice(
      0,
      currentCategoryIndex
    );
    const allPreviousCompleted = previousCategoryActivities.every(
      (act) => act.completed
    );

    // If previous activities in the same category are not completed, don't allow toggling
    if (!allPreviousCompleted && !room.activities[activityIndex].completed) {
      return;
    }

    setRooms((prev) =>
      prev.map((room) => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          activities: room.activities.map((act) =>
            act.id === activityId ? { ...act, completed: !act.completed } : act
          ),
        };
      })
    );
  };

  const handleFinishCleaning = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const allComplete = room.activities.every((a) => a.completed);
    if (allComplete) {
      const endTime = Date.now();
      const startTime = room.startTime || endTime;
      const duration = Math.floor((endTime - startTime) / 1000);
      const cleaningDate = new Date(endTime).toISOString().split("T")[0];

      // Create cleaning history record
      const historyRecord: CleaningHistoryRecord = {
        id: `history-${roomId}-${endTime}`,
        roomId: room.id,
        roomNumber: room.number,
        roomType: room.type,
        floor: room.floor,
        cleaningDate,
        startTime,
        endTime,
        duration,
        status: "completed",
        completedTasks: room.activities.map((act) => ({ ...act })), // Snapshot of completed activities
        housekeeperId: currentCleanerId,
        housekeeperName: currentCleanerName,
      };

      // Add to cleaning history
      setCleaningHistory((prev) => [historyRecord, ...prev]);

      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, status: "available", startTime: undefined }
            : r
        )
      );

      // Remove room from selected (navigation handled by useEffect)
      setSelectedRoomIds((prev) => {
        const updated = prev.filter((id) => id !== roomId);
        // Stop timer if this was the last room
        if (updated.length === 0) {
          setCleaningSessionStartTime(null);
          setTotalCleaningTimer(0);
        }
        return updated;
      });

      // Clear activity view for finished room
      setActiveActivityView((prev) => {
        const updated = { ...prev };
        delete updated[roomId];
        return updated;
      });
    }
  };

  const confirmFinishAll = () => {
    selectedRooms.forEach((room) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === room.id
            ? { ...r, status: "available", startTime: undefined }
            : r
        )
      );
    });

    // Clear all activity views
    setActiveActivityView({});

    // Stop the timer and reset
    setCleaningSessionStartTime(null);
    setTotalCleaningTimer(0);
    setSelectedRoomIds([]);
    setShowFinishConfirm(false);
    setHousekeeperStage("dashboard");
  };

  if (mode === "housekeeper") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6 lg:space-y-8">
          {housekeeperStage === "dashboard" && (
            <>
              <div className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
                      Housekeeping Dashboard
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                      Checkout Queue
                    </h1>
                    <p className="text-sm text-slate-500">
                      Select one or more rooms in checkout state to start
                      cleaning.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:items-end w-full sm:w-auto">
                    <div className="rounded-2xl bg-blue-50 px-4 py-3 w-full sm:w-auto sm:text-right">
                      <p className="text-xs text-blue-500">Selected</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {selectedRoomIds.length}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="lg"
                        variant="secondary"
                        onClick={() => setHousekeeperStage("history")}
                        className="w-full sm:w-auto"
                      >
                        <History className="h-4 w-4 mr-2" />
                        View History
                      </Button>
                      <Button
                        size="lg"
                        onClick={handleProceed}
                        disabled={selectedRoomIds.length < 1}
                        className="bg-gradient-to-r from-blue-600 to-cyan-500 w-full sm:w-auto"
                      >
                        Proceed ({selectedRoomIds.length}{" "}
                        {selectedRoomIds.length === 1 ? "room" : "rooms"})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {selectedRoomIds.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">
                    Selected Rooms
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedRooms.map((room) => (
                      <button
                        key={room.id}
                        onClick={() => handleCancelRoom(room.id)}
                        className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                        title={
                          room.status === "inCleaning"
                            ? "Remove room (will notify manager)"
                            : "Cancel room"
                        }
                      >
                        #{room.number}
                        <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-rose-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                    <span className="font-semibold text-sm sm:text-base">
                      Checkout Rooms
                    </span>
                  </div>
                  <div className="relative flex-1 sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search by floor number..."
                      value={housekeeperFloorSearch}
                      onChange={(e) =>
                        setHousekeeperFloorSearch(e.target.value)
                      }
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
                  {checkoutRooms.map((room) => {
                    const isSelected = selectedRoomIds.includes(room.id);
                    return (
                      <button
                        key={room.id}
                        onClick={() => toggleSelectedRoom(room.id)}
                        className={`flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                          isSelected
                            ? "ring-2 ring-blue-400 shadow-blue-100"
                            : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-widest text-slate-400">
                              Room
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                              {room.number}
                            </p>
                          </div>
                          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">
                            Checkout
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {room.type} • Floor {room.floor}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <DoorOpen className="h-4 w-4 text-blue-500" />
                            Cleaning Required
                          </div>
                          <div
                            className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "border-blue-500 bg-blue-500"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {checkoutRooms.length === 0 && (
                    <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                      No checkout rooms available.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold text-sm sm:text-base">
                    Rooms in Cleaning Progress
                  </span>
                </div>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
                  {inProgressRooms.map((room) => (
                    <div
                      key={room.id}
                      className="rounded-[20px] border border-slate-200 bg-white p-4 sm:p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-blue-400">
                            Room
                          </p>
                          <p className="text-2xl font-bold text-slate-900">
                            {room.number}
                          </p>
                          <p className="text-sm text-slate-500">{room.type}</p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                          In Progress
                        </span>
                      </div>
                    </div>
                  ))}
                  {inProgressRooms.length === 0 && (
                    <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                      No rooms in cleaning progress.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {housekeeperStage === "selected" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => setHousekeeperStage("dashboard")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
                      Selected Rooms
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Ready to Start Cleaning
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
                {selectedRooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                          Room
                        </p>
                        <p className="text-3xl font-bold text-slate-900">
                          {room.number}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          {room.type} • Floor {room.floor}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">
                          Checkout
                        </span>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-500">
                          Selected
                        </span>
                      </div>
                      <Button
                        size="lg"
                        onClick={() => handleStartCleaning(room.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-500"
                      >
                        Start Cleaning
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {housekeeperStage === "activities" && selectedRooms.length >= 1 && (
            <div className="space-y-6">
              <div className="sticky top-0 z-30">
                <div className="rounded-2xl border border-slate-200 bg-white/95 px-4 sm:px-6 lg:px-8 py-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
                  <div className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
                    <div className="space-y-1 md:order-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
                        Room Cleaning Activities
                      </p>
                      <h2 className="text-3xl font-bold text-slate-900">
                        {selectedRooms.length}{" "}
                        {selectedRooms.length === 1 ? "Room" : "Rooms"} Selected
                      </h2>
                      <p className="text-sm text-slate-500">
                        Mark each activity once completed for all rooms.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 md:order-2">
                      {selectedRooms.map((room) => (
                        <div
                          key={room.id}
                          className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                        >
                          Room {room.number}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end md:order-3">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setHousekeeperStage("dashboard");
                        }}
                        className="cursor-pointer"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Room List
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs sm:text-sm font-semibold text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Progress is saved. You can return to add more rooms, but
                      remember to finish every activity before ending the
                      session.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed-size room cards grid - consistent 600px width regardless of count */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
                {selectedRooms.map((room) => {
                  return (
                    <div
                      key={room.id}
                      className="rounded-3xl border border-slate-200 bg-white px-4 sm:px-6 pt-4 sm:pt-6 pb-0 shadow-lg w-full max-w-[600px] min-h-[400px] flex flex-col"
                    >
                      {/* Room content - same as below */}
                      {(() => {
                        const washroomActivities = room.activities.filter(
                          (act) => act.category === "washroom"
                        );
                        const bedroomActivities = room.activities.filter(
                          (act) => act.category === "bedroom"
                        );

                        return (
                          <>
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-2xl font-bold text-slate-900">
                                  Room {room.number}
                                </h3>
                                {/* Show Remove Room button only if no activities are completed */}
                                {room.activities.every((a) => !a.completed) && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleRemoveRoom(room.id)}
                                    className="border-rose-300 text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Remove Room
                                  </Button>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 mb-3">
                                {room.type} • Floor {room.floor}
                              </p>

                              {/* Progress Bar */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-slate-600">
                                    Progress
                                  </span>
                                  <span className="text-xs font-semibold text-slate-700">
                                    {Math.round(
                                      (room.activities.filter(
                                        (a) => a.completed
                                      ).length /
                                        room.activities.length) *
                                        100
                                    )}
                                    %
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{
                                      width: `${
                                        (room.activities.filter(
                                          (a) => a.completed
                                        ).length /
                                          room.activities.length) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Activity View Buttons */}
                              <div className="flex gap-2 mb-4">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    toggleActivityView(room.id, "washroom")
                                  }
                                  className={`flex-1 cursor-pointer ${
                                    activeActivityView[room.id] === "washroom"
                                      ? "bg-blue-100 border-blue-400 text-blue-700"
                                      : "border-slate-300"
                                  }`}
                                >
                                  <Bath className="mr-2 h-4 w-4" />
                                  Washroom Activities
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() =>
                                    toggleActivityView(room.id, "bedroom")
                                  }
                                  className={`flex-1 cursor-pointer ${
                                    activeActivityView[room.id] === "bedroom"
                                      ? "bg-blue-100 border-blue-400 text-blue-700"
                                      : "border-slate-300"
                                  }`}
                                >
                                  <BedDouble className="mr-2 h-4 w-4" />
                                  Bedroom Activities
                                </Button>
                              </div>

                              {/* Washroom Activities - Only show when active */}
                              {activeActivityView[room.id] === "washroom" && (
                                <div className="mb-3">
                                  <div className="space-y-2">
                                    {washroomActivities.map((activity) => {
                                      const Icon = activity.icon;
                                      const categoryActivities =
                                        washroomActivities;
                                      const currentCategoryIndex =
                                        categoryActivities.findIndex(
                                          (act) => act.id === activity.id
                                        );
                                      const previousCategoryActivities =
                                        categoryActivities.slice(
                                          0,
                                          currentCategoryIndex
                                        );
                                      const allPreviousCompleted =
                                        previousCategoryActivities.every(
                                          (act) => act.completed
                                        );
                                      const isLocked =
                                        !allPreviousCompleted &&
                                        !activity.completed;

                                      return (
                                        <button
                                          key={activity.id}
                                          onClick={() =>
                                            toggleActivity(activity.id, room.id)
                                          }
                                          disabled={isLocked}
                                          className={`w-full rounded-xl border-2 p-4 text-left shadow-sm transition-all ${
                                            activity.completed
                                              ? "border-emerald-400 bg-emerald-50 cursor-pointer"
                                              : isLocked
                                              ? "border-rose-400 bg-rose-50 cursor-not-allowed opacity-75"
                                              : "border-slate-200 bg-white hover:border-blue-300 cursor-pointer"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <div
                                                className={`rounded-lg p-2 ${
                                                  activity.completed
                                                    ? "bg-emerald-500 text-white"
                                                    : isLocked
                                                    ? "bg-rose-500 text-white"
                                                    : "bg-slate-100 text-slate-600"
                                                }`}
                                              >
                                                <Icon className="h-4 w-4" />
                                              </div>
                                              <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                  {activity.label}
                                                </p>
                                              </div>
                                            </div>
                                            {activity.completed ? (
                                              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                            ) : isLocked ? (
                                              <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                                            ) : (
                                              <ListChecks className="h-5 w-5 text-slate-300 flex-shrink-0" />
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Bedroom Activities - Only show when active */}
                              {activeActivityView[room.id] === "bedroom" && (
                                <div>
                                  <div className="space-y-2">
                                    {bedroomActivities.map((activity) => {
                                      const Icon = activity.icon;
                                      const categoryActivities =
                                        bedroomActivities;
                                      const currentCategoryIndex =
                                        categoryActivities.findIndex(
                                          (act) => act.id === activity.id
                                        );
                                      const previousCategoryActivities =
                                        categoryActivities.slice(
                                          0,
                                          currentCategoryIndex
                                        );
                                      const allPreviousCompleted =
                                        previousCategoryActivities.every(
                                          (act) => act.completed
                                        );
                                      const isLocked =
                                        !allPreviousCompleted &&
                                        !activity.completed;

                                      return (
                                        <button
                                          key={activity.id}
                                          onClick={() =>
                                            toggleActivity(activity.id, room.id)
                                          }
                                          disabled={isLocked}
                                          className={`w-full rounded-xl border-2 p-4 text-left shadow-sm transition-all ${
                                            activity.completed
                                              ? "border-emerald-400 bg-emerald-50 cursor-pointer"
                                              : isLocked
                                              ? "border-rose-400 bg-rose-50 cursor-not-allowed opacity-75"
                                              : "border-slate-200 bg-white hover:border-blue-300 cursor-pointer"
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                              <div
                                                className={`rounded-lg p-2 ${
                                                  activity.completed
                                                    ? "bg-emerald-500 text-white"
                                                    : isLocked
                                                    ? "bg-rose-500 text-white"
                                                    : "bg-slate-100 text-slate-600"
                                                }`}
                                              >
                                                <Icon className="h-4 w-4" />
                                              </div>
                                              <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                  {activity.label}
                                                </p>
                                              </div>
                                            </div>
                                            {activity.completed ? (
                                              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                            ) : isLocked ? (
                                              <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                                            ) : (
                                              <ListChecks className="h-5 w-5 text-slate-300 flex-shrink-0" />
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Individual Room Finish Button */}
                            <div className="mt-4 pt-4 border-t border-slate-200 pb-0">
                              <Button
                                size="sm"
                                onClick={() => handleFinishCleaning(room.id)}
                                disabled={
                                  !room.activities.every((a) => a.completed)
                                }
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 cursor-pointer disabled:cursor-not-allowed"
                              >
                                Finish Room {room.number}
                              </Button>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {housekeeperStage === "history" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
                      Cleaning History
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900">
                      Completed Rooms
                    </h2>
                    <p className="text-sm text-slate-500">
                      View all rooms you have finished cleaning
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setHousekeeperStage("dashboard")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </div>
              </div>

              {cleaningHistory.length > 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-widest text-slate-400 border-b border-slate-200">
                        <th className="px-4 py-3 font-semibold">Room Number</th>
                        <th className="px-4 py-3 font-semibold">Floor</th>
                        <th className="px-4 py-3 font-semibold">Room Type</th>
                        <th className="px-4 py-3 font-semibold">
                          Cleaning Date
                        </th>
                        <th className="px-4 py-3 font-semibold">Start Time</th>
                        <th className="px-4 py-3 font-semibold">End Time</th>
                        <th className="px-4 py-3 font-semibold">Duration</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cleaningHistory.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b border-slate-100 last:border-none hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            #{record.roomNumber}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {record.floor}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {record.roomType}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(record.cleaningDate)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatTimeDisplay(record.startTime)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatTimeDisplay(record.endTime)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatTimeLong(record.duration)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                  <History className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 font-medium">
                    No cleaning history available
                  </p>
                  <p className="text-sm text-slate-400 mt-2">
                    Completed rooms will appear here
                  </p>
                </div>
              )}
            </div>
          )}

          <Modal
            isOpen={showFinishConfirm}
            onClose={() => setShowFinishConfirm(false)}
            title="Confirm Completion"
          >
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure all cleaning tasks are completed for all{" "}
                {selectedRooms.length} rooms?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowFinishConfirm(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={confirmFinishAll}>
                  Confirm
                </Button>
              </div>
            </div>
          </Modal>

          <Modal
            isOpen={showMessageModal}
            onClose={() => {
              setShowMessageModal(false);
              setMessageRoomId(null);
              setMessageNote("");
            }}
            title="Send Message to Dashboard"
          >
            <div className="space-y-4">
              {messageRoomId && (
                <>
                  <div className="rounded-lg bg-slate-50 p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        Room Number:
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {rooms.find((r) => r.id === messageRoomId)?.number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        Cleaner Name:
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {currentCleanerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        Time Spent:
                      </span>
                      <span className="text-sm font-semibold text-rose-600">
                        {messageRoomId &&
                        rooms.find((r) => r.id === messageRoomId)?.startTime
                          ? formatTime(
                              Math.floor(
                                (Date.now() -
                                  (rooms.find((r) => r.id === messageRoomId)
                                    ?.startTime || 0)) /
                                  1000
                              )
                            )
                          : formatTime(0)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600 mb-2 block">
                      Optional Note:
                    </label>
                    <textarea
                      value={messageNote}
                      onChange={(e) => setMessageNote(e.target.value)}
                      placeholder="Add any additional information..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 min-h-[100px]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        setShowMessageModal(false);
                        setMessageRoomId(null);
                        setMessageNote("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={handleSendMessage}>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Modal>

          <Modal
            isOpen={showHistoryDetailsModal}
            onClose={() => {
              setShowHistoryDetailsModal(false);
              setSelectedHistoryRecord(null);
            }}
            title="Cleaning Details"
          >
            {selectedHistoryRecord && historyTasksByCategory ? (
              <div className="space-y-6">
                {/* Room Information */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Room Number</p>
                      <p className="text-lg font-bold text-slate-900">
                        #{selectedHistoryRecord.roomNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Room Type</p>
                      <p className="text-lg font-semibold text-slate-700">
                        {selectedHistoryRecord.roomType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Floor</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {selectedHistoryRecord.floor}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        Cleaning Date
                      </p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatDate(selectedHistoryRecord.cleaningDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Start Time</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatTimeDisplay(selectedHistoryRecord.startTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">End Time</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatTimeDisplay(selectedHistoryRecord.endTime)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">Duration</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatTimeLong(selectedHistoryRecord.duration)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200">
                  <div className="flex gap-2 overflow-x-auto">
                    {historyTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setHistoryDetailsActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                          historyDetailsActiveTab === tab.id
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {tab.label} ({tab.count})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tasks by Category */}
                <div className="min-h-[200px]">
                  {historyTasksByCategory[historyDetailsActiveTab].length >
                  0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {historyTasksByCategory[historyDetailsActiveTab].map(
                        (task) => {
                          const Icon = task.icon;
                          return (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                            >
                              <div className="flex-shrink-0 rounded-full bg-emerald-100 p-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-900">
                                  {task.label}
                                </p>
                              </div>
                              <Icon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <p className="text-sm">No tasks in this category</p>
                    </div>
                  )}
                </div>

                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setShowHistoryDetailsModal(false);
                    setSelectedHistoryRecord(null);
                    setHistoryDetailsActiveTab("bedroom");
                  }}
                >
                  Close
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No record selected</p>
              </div>
            )}
          </Modal>
        </div>
      </div>
    );
  }

  // Manager View
  const managerMetrics = useMemo(() => {
    const checkout = rooms.filter((r) => r.status === "checkout").length;
    const inCleaning = rooms.filter((r) => r.status === "inCleaning").length;
    const assigned = rooms.filter((r) => r.status === "assigned").length;
    const available = rooms.filter((r) => r.status === "available").length;
    return { checkout, inCleaning, assigned, available };
  }, [rooms]);

  const managerCheckoutRooms = useMemo(() => {
    const filtered = rooms.filter((r) => r.status === "checkout");
    // Filter by room number if search is active (manager view)
    if (managerRoomSearch) {
      return filtered.filter((r) =>
        r.number.toLowerCase().includes(managerRoomSearch.toLowerCase())
      );
    }
    return filtered;
  }, [rooms, managerRoomSearch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
        <section className="rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
                Manager
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Housekeeper Management
              </h1>
              <p className="text-sm text-slate-500">
                Create, update, and manage the housekeeping team.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => navigate("/housekeeping/cleaning-task-list")}
                className="w-full sm:w-auto"
              >
                Cleaning Task List
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={openCreateProfile}
                className="w-full sm:w-auto"
              >
                Add Housekeeper
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col items-start justify-start gap-3">
              <div className="w-full">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
                  Checked-out Rooms
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-rose-600">
                  {managerMetrics.checkout}
                </p>
              </div>
              <div className="rounded-2xl bg-rose-100 p-2">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-rose-600" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col items-start justify-start gap-3">
              <div className="w-full">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
                  Rooms in Cleaning
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-blue-600">
                  {managerMetrics.inCleaning}
                </p>
              </div>
              <div className="rounded-2xl bg-blue-100 p-2">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col items-start justify-start gap-3">
              <div className="w-full">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
                  Assigned Rooms
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-amber-600">
                  {managerMetrics.assigned}
                </p>
              </div>
              <div className="rounded-2xl bg-amber-100 p-2">
                <ClipboardCheck className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col items-start justify-start gap-3">
              <div className="w-full">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1">
                  Completed
                </p>
                <p className="text-3xl sm:text-4xl font-bold text-emerald-600">
                  {managerMetrics.available}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-100 p-2">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </section>

        {/* Housekeeper Activities Section - Manager depends on housekeeper activities */}
        <section className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                Housekeeper Activities
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Real-time view of rooms selected by housekeepers
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {housekeepers
              .filter((hk) => hk.active)
              .map((cleaner) => {
                const cleanerHistory = roomHistory[cleaner.id] || [];
                const selfSelectedRooms = cleanerHistory.filter(
                  (entry) => entry.assignedBy === "housekeeper"
                );
                const managerAssignedRooms = cleanerHistory.filter(
                  (entry) => entry.assignedBy === "manager"
                );
                const currentRooms = rooms.filter(
                  (r) =>
                    r.assignedTo === cleaner.name && r.status !== "available"
                );

                return (
                  <div
                    key={cleaner.id}
                    className="rounded-2xl border border-cyan-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3">
                      <p className="font-semibold text-slate-900">
                        {cleaner.name}
                      </p>
                      <p className="text-xs text-slate-500">{cleaner.email}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          Self-Selected Rooms:
                        </span>
                        <span className="font-bold text-cyan-600">
                          {selfSelectedRooms.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          Manager-Assigned:
                        </span>
                        <span className="font-bold text-purple-600">
                          {managerAssignedRooms.length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">
                          Currently Active:
                        </span>
                        <span className="font-bold text-blue-600">
                          {currentRooms.length}
                        </span>
                      </div>
                      {selfSelectedRooms.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-700 mb-1">
                            Recently Selected:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selfSelectedRooms.slice(-3).map((entry, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-700"
                              >
                                #{entry.roomNumber}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            {housekeepers.filter((hk) => hk.active).length === 0 && (
              <div className="col-span-full text-center py-4 text-slate-500 text-sm">
                No active housekeepers
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">
              Active Cleaners Monitoring
            </h3>
            {messages.length > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1">
                <MessageSquare className="h-4 w-4 text-rose-600" />
                <span className="text-xs font-semibold text-rose-600">
                  {messages.length} Message{messages.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
          {activeCleaners.length > 0 ? (
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {activeCleaners.map((cleaner) => {
                  const progress = getCleanerProgress(cleaner.profile?.id);
                  const allCompleted = cleaner.rooms.every((room) =>
                    room.activities.every((act) => act.completed)
                  );

                  // Calculate total time spent across all rooms
                  const totalTimeSpent = cleaner.rooms.reduce((total, room) => {
                    if (room.startTime) {
                      const calculatedTime = Math.floor(
                        (Date.now() - room.startTime) / 1000
                      );
                      return total + calculatedTime;
                    }
                    return total;
                  }, 0);

                  return (
                    <div
                      key={cleaner.name}
                      className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-4 sm:p-5 shadow-sm min-w-[280px] sm:min-w-[320px] flex-shrink-0"
                    >
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-slate-600">
                          Cleaner
                        </p>
                        <p className="text-lg md:text-xl font-bold text-slate-900">
                          {cleaner.name}
                        </p>
                        {cleaner.profile && (
                          <p className="text-xs text-slate-500 mt-1">
                            {cleaner.profile.phone}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-700 mb-2">
                            Current Rooms: {cleaner.rooms.length}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cleaner.rooms.map((room) => {
                              const displayTime = room.startTime
                                ? Math.floor(
                                    (Date.now() - room.startTime) / 1000
                                  )
                                : 0;

                              return (
                                <div
                                  key={room.id}
                                  className="flex items-center gap-2"
                                >
                                  <span className="inline-block rounded-lg bg-white px-2 py-1 text-xs font-semibold text-blue-600 border border-blue-200">
                                    #{room.number}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {formatTime(displayTime)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setReassignData({
                                        roomId: room.id,
                                        fromCleanerId:
                                          cleaner.profile?.id || "",
                                      });
                                      setShowReassignModal(true);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 text-xs font-semibold"
                                    title="Reassign this room"
                                  >
                                    ↻
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-slate-700">
                              Time Started
                            </p>
                            <p className="text-xs text-slate-500">
                              {cleaner.rooms[0]?.startTime
                                ? new Date(
                                    cleaner.rooms[0].startTime
                                  ).toLocaleTimeString()
                                : "N/A"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-slate-700">
                              Time Spent
                            </p>
                            <p className="text-sm font-bold text-blue-600">
                              {formatTime(totalTimeSpent)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-semibold text-slate-700">
                              Activity Progress
                            </p>
                            <p className="text-sm font-bold text-blue-600">
                              {progress.percentage}%
                            </p>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                allCompleted ? "bg-emerald-500" : "bg-blue-500"
                              }`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {progress.completed} of {progress.total} activities
                          </p>
                        </div>

                        <div>
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                              allCompleted
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {allCompleted ? "Completed" : "In Progress"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No active cleaners. Assign rooms to get started.
            </div>
          )}
        </section>

        {/* Messages Section */}
        {messages.length > 0 && (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-rose-600" />
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                Cleaning Messages
              </h3>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.map((msg) => {
                const room = rooms.find((r) => r.number === msg.roomNumber);
                const isAvailableForReassignment =
                  room && room.status === "checkout";

                return (
                  <div
                    key={msg.id}
                    className="rounded-xl border border-rose-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          Room {msg.roomNumber} • {msg.cleanerName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(msg.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-600">
                        {msg.timeSpent}
                      </span>
                    </div>
                    {msg.note && (
                      <p className="text-sm text-slate-600 mt-2 italic">
                        "{msg.note}"
                      </p>
                    )}
                    {isAvailableForReassignment && (
                      <div className="mt-4 pt-4 border-t border-rose-200">
                        <p className="text-xs font-semibold text-slate-700 mb-2">
                          Assign to another cleaner:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {housekeepers
                            .filter(
                              (hk) => hk.active && hk.name !== msg.cleanerName
                            )
                            .map((hk) => (
                              <Button
                                key={hk.id}
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  // Assign room to this cleaner
                                  setSelectedRoomId(room.id);
                                  setSelectedHousekeeperId(hk.id);
                                  confirmAssignment();
                                }}
                                className="text-xs"
                              >
                                {hk.name}
                              </Button>
                            ))}
                          {housekeepers.filter(
                            (hk) => hk.active && hk.name !== msg.cleanerName
                          ).length === 0 && (
                            <p className="text-xs text-slate-500">
                              No other active cleaners available
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">
              Checked-out Rooms
            </h3>
            <div className="relative flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by room number..."
                value={managerRoomSearch}
                onChange={(e) => setManagerRoomSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 w-full min-w-0">
            {managerCheckoutRooms.map((room) => {
              return (
                <div
                  key={room.id}
                  id={`room-${room.id}`}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-widest text-slate-400">
                        Room
                      </p>
                      <p className="text-2xl font-bold text-slate-900">
                        {room.number}
                      </p>
                      <p className="text-sm text-slate-500">
                        {room.type} • Floor {room.floor}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-500">
                        Checkout
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleAssignClick(room.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {managerCheckoutRooms.length === 0 && (
              <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                No checkout rooms available.
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {housekeepers.map((hk) => (
            <div
              key={hk.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {hk.name}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold w-fit ${
                    hk.active
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {hk.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{hk.phone}</span>
                </div>
                <div className="flex items-center gap-2 break-all">
                  <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  {hk.email}
                </div>
              </div>
              <div className="mt-4 flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 min-w-[100px]"
                  onClick={() => openEditProfile(hk)}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 min-w-[100px] text-rose-500"
                  onClick={() => handleDeleteProfile(hk.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {housekeepers.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No housekeepers yet. Add your first team member.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
          <h3 className="text-xl font-bold text-slate-900 mb-4">
            Cleaner Assignment Table
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-slate-400 border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold">Cleaner Name</th>
                  <th className="px-4 py-3 font-semibold">Attendance</th>
                  <th className="px-4 py-3 font-semibold">Assigned Rooms</th>
                  <th className="px-4 py-3 font-semibold">Cleaning Status</th>
                  <th className="px-4 py-3 font-semibold">History</th>
                </tr>
              </thead>
              <tbody>
                {housekeepers.map((cleaner) => {
                  const cleanerRooms = rooms.filter(
                    (room) => room.assignedTo === cleaner.name
                  );
                  const allCompleted =
                    cleanerRooms.length > 0 &&
                    cleanerRooms.every((room) => room.status === "available");
                  const hasPending = cleanerRooms.some(
                    (room) => room.status !== "available"
                  );

                  // Get all room numbers from history (both assigned and selected)
                  const cleanerHistory = roomHistory[cleaner.id] || [];
                  const allHistoryRooms = cleanerHistory.map(
                    (entry) => entry.roomNumber
                  );
                  const managerAssignedRooms = cleanerHistory
                    .filter((entry) => entry.assignedBy === "manager")
                    .map((entry) => entry.roomNumber);
                  const selfSelectedRooms = cleanerHistory
                    .filter((entry) => entry.assignedBy === "housekeeper")
                    .map((entry) => entry.roomNumber);

                  return (
                    <tr
                      key={cleaner.id}
                      className="border-b border-slate-100 last:border-none"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {cleaner.name}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            cleaner.active
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {cleaner.active ? "Present" : "Absent"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="space-y-1">
                          {allHistoryRooms.length > 0 ? (
                            <>
                              <div className="flex flex-wrap gap-1">
                                {allHistoryRooms.map((roomNum, idx) => {
                                  const isManagerAssigned =
                                    managerAssignedRooms.includes(roomNum);
                                  return (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        isManagerAssigned
                                          ? "bg-purple-100 text-purple-700"
                                          : "bg-cyan-100 text-cyan-700"
                                      }`}
                                      title={
                                        isManagerAssigned
                                          ? "Assigned by Manager"
                                          : "Selected by Housekeeper"
                                      }
                                    >
                                      #{roomNum}
                                      {isManagerAssigned ? (
                                        <span className="text-purple-500">
                                          M
                                        </span>
                                      ) : (
                                        <span className="text-cyan-500">S</span>
                                      )}
                                    </span>
                                  );
                                })}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                Total: {allHistoryRooms.length} | Manager:{" "}
                                {managerAssignedRooms.length} | Self:{" "}
                                {selfSelectedRooms.length}
                              </div>
                            </>
                          ) : cleanerRooms.length > 0 ? (
                            cleanerRooms.map((room) => room.number).join(", ")
                          ) : (
                            "—"
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {cleanerRooms.length > 0 ? (
                          allCompleted ? (
                            <span className="flex items-center gap-2 font-semibold text-emerald-600">
                              <CheckCircle2 className="h-5 w-5" /> Completed
                            </span>
                          ) : hasPending ? (
                            <span className="flex items-center gap-2 font-semibold text-rose-600">
                              <XCircle className="h-5 w-5" /> Pending
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 font-semibold text-slate-400">
                              —
                            </span>
                          )
                        ) : (
                          <span className="flex items-center gap-2 font-semibold text-slate-400">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenHistory(cleaner.id)}
                          className="flex items-center gap-2"
                        >
                          <History className="h-4 w-4" />
                          History
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {rejectedHousekeeperId && selectedRoomId && (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-md">
            <div className="mb-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                Cleaner unavailable. Please reassign room{" "}
                <strong>
                  {rooms.find((room) => room.id === selectedRoomId)?.number ??
                    "--"}
                </strong>{" "}
                to another cleaner:
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {housekeepers
                .filter((hk) => hk.id !== rejectedHousekeeperId)
                .map((hk) => (
                  <Button
                    key={hk.id}
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReassign(hk.id)}
                  >
                    {hk.name}
                  </Button>
                ))}
            </div>
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setRejectedHousekeeperId(null);
                  setSelectedRoomId("");
                  setSelectedHousekeeperId("");
                }}
              >
                Cancel
              </Button>
            </div>
          </section>
        )}
      </div>

      <Modal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setFormErrors({});
        }}
        title={editingProfile ? "Edit Housekeeper" : "Add Housekeeper"}
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-semibold text-slate-600">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              value={profileForm.name}
              onChange={(e) => {
                setProfileForm((prev) => ({ ...prev, name: e.target.value }));
                if (formErrors.name)
                  setFormErrors((prev) => ({ ...prev, name: "" }));
              }}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400 ${
                formErrors.name ? "border-red-500" : "border-slate-200"
              } bg-white`}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-semibold text-slate-600">
              Phone <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => {
                // Only allow numbers
                const value = e.target.value.replace(/\D/g, "");
                setProfileForm((prev) => ({ ...prev, phone: value }));
                if (formErrors.phone)
                  setFormErrors((prev) => ({ ...prev, phone: "" }));
              }}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400 ${
                formErrors.phone ? "border-red-500" : "border-slate-200"
              } bg-white`}
            />
            {formErrors.phone && (
              <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-semibold text-slate-600">
              Email
            </label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => {
                setProfileForm((prev) => ({ ...prev, email: e.target.value }));
                if (formErrors.email)
                  setFormErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400 ${
                formErrors.email ? "border-red-500" : "border-slate-200"
              } bg-white`}
            />
            {formErrors.email && (
              <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
            )}
          </div>

          {/* NIC */}
          <div>
            <label className="text-sm font-semibold text-slate-600">
              NIC <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={profileForm.nic}
              onChange={(e) => {
                setProfileForm((prev) => ({
                  ...prev,
                  nic: e.target.value.toUpperCase(),
                }));
                if (formErrors.nic)
                  setFormErrors((prev) => ({ ...prev, nic: "" }));
              }}
              placeholder="e.g., 123456789V or 200145601234"
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400 ${
                formErrors.nic ? "border-red-500" : "border-slate-200"
              } bg-white`}
            />
            {formErrors.nic && (
              <p className="mt-1 text-xs text-red-600">{formErrors.nic}</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-semibold text-slate-600">
              Address <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={profileForm.address}
              onChange={(e) => {
                setProfileForm((prev) => ({
                  ...prev,
                  address: e.target.value,
                }));
                if (formErrors.address)
                  setFormErrors((prev) => ({ ...prev, address: "" }));
              }}
              rows={3}
              className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-400 resize-y ${
                formErrors.address ? "border-red-500" : "border-slate-200"
              } bg-white`}
            />
            {formErrors.address && (
              <p className="mt-1 text-xs text-red-600">{formErrors.address}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-semibold text-slate-600">
              Status <span className="text-rose-500">*</span>
            </label>
            <select
              value={profileForm.active ? "active" : "inactive"}
              onChange={(e) =>
                setProfileForm((prev) => ({
                  ...prev,
                  active: e.target.value === "active",
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setShowProfileModal(false);
                setFormErrors({});
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showHousekeeperSelectModal}
        onClose={() => {
          setShowHousekeeperSelectModal(false);
          setSelectedRoomId("");
          setSelectedHousekeeperId("");
        }}
        title="Select Housekeeper"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Assign room{" "}
            <strong>
              {rooms.find((room) => room.id === selectedRoomId)?.number ?? "--"}
            </strong>{" "}
            to:
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {housekeepers
              .filter((hk) => hk.active)
              .map((hk) => (
                <button
                  key={hk.id}
                  onClick={() => handleHousekeeperSelect(hk.id)}
                  className="w-full text-left rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition"
                >
                  <p className="font-semibold text-slate-900">{hk.name}</p>
                  <p className="text-sm text-slate-500">{hk.email}</p>
                  <p className="text-xs text-slate-400 mt-1">{hk.phone}</p>
                </button>
              ))}
            {housekeepers.filter((hk) => hk.active).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No active housekeepers available
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setShowHousekeeperSelectModal(false);
              setSelectedRoomId("");
              setSelectedHousekeeperId("");
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          const wasReassignment = isReassignment;
          setShowConfirmModal(false);
          setRejectedHousekeeperId(null);
          setIsReassignment(false);
          if (wasReassignment) {
            setReassignData(null);
          }
          setSelectedRoomId("");
          setSelectedHousekeeperId("");
        }}
        title="Can you clean these rooms?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {isReassignment ? (
              <>
                Reassign room{" "}
                <strong>
                  {rooms.find((room) => room.id === selectedRoomId)?.number ??
                    "--"}
                </strong>{" "}
                to{" "}
                <strong>
                  {housekeepers.find((hk) => hk.id === selectedHousekeeperId)
                    ?.name ?? "--"}
                </strong>
                ?
              </>
            ) : (
              <>
                Assign room{" "}
                <strong>
                  {rooms.find((room) => room.id === selectedRoomId)?.number ??
                    "--"}
                </strong>{" "}
                to{" "}
                <strong>
                  {housekeepers.find((hk) => hk.id === selectedHousekeeperId)
                    ?.name ?? "--"}
                </strong>
                ?
              </>
            )}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => handleAssignment(false)}
            >
              No
            </Button>
            <Button className="flex-1" onClick={() => handleAssignment(true)}>
              Yes
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReassignModal}
        onClose={() => {
          setShowReassignModal(false);
          setReassignData(null);
        }}
        title="Reassign Room"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Reassign room{" "}
            <strong>
              {reassignData
                ? rooms.find((r) => r.id === reassignData.roomId)?.number
                : "--"}
            </strong>{" "}
            to another cleaner:
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {housekeepers
              .filter(
                (hk) => hk.active && hk.id !== reassignData?.fromCleanerId
              )
              .map((hk) => (
                <button
                  key={hk.id}
                  onClick={() => handleReassignActiveCleaning(hk.id)}
                  className="w-full text-left rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 transition"
                >
                  <p className="font-semibold text-slate-900">{hk.name}</p>
                  <p className="text-sm text-slate-500">{hk.phone}</p>
                </button>
              ))}
            {housekeepers.filter(
              (hk) => hk.active && hk.id !== reassignData?.fromCleanerId
            ).length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No other active cleaners available
              </p>
            )}
          </div>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setShowReassignModal(false);
              setReassignData(null);
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedCleanerForHistory(null);
        }}
        title="Assigned Room History"
      >
        <div className="space-y-4">
          {selectedCleanerForHistory &&
            (() => {
              const cleaner = housekeepers.find(
                (hk) => hk.id === selectedCleanerForHistory
              );
              const cleanerHistory =
                roomHistory[selectedCleanerForHistory] || [];

              // Sample data if no real data
              const sampleData = [
                {
                  roomNumber: "204",
                  assignedBy: "manager" as const,
                  timestamp: Date.now() - 86400000 * 5,
                },
                {
                  roomNumber: "305",
                  assignedBy: "manager" as const,
                  timestamp: Date.now() - 86400000 * 4,
                },
                {
                  roomNumber: "112",
                  assignedBy: "manager" as const,
                  timestamp: Date.now() - 86400000 * 3,
                },
                {
                  roomNumber: "218",
                  assignedBy: "housekeeper" as const,
                  timestamp: Date.now() - 86400000 * 2,
                },
                {
                  roomNumber: "407",
                  assignedBy: "housekeeper" as const,
                  timestamp: Date.now() - 86400000 * 1,
                },
              ];

              const displayHistory =
                cleanerHistory.length > 0 ? cleanerHistory : sampleData;

              return (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-slate-600">
                      All room details for{" "}
                      <strong>{cleaner?.name ?? "--"}</strong>: Shows both
                      manager-assigned and housekeeper-selected rooms.
                    </p>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {displayHistory.length > 0 ? (
                      <div className="space-y-3">
                        {displayHistory.map((entry, index) => {
                          return (
                            <div
                              key={index}
                              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                            >
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-base font-bold text-slate-900">
                                    Room {entry.roomNumber}
                                  </span>
                                  <span className="text-slate-400">•</span>
                                  <span
                                    className={`text-sm font-semibold ${
                                      entry.assignedBy === "manager"
                                        ? "text-purple-700"
                                        : "text-cyan-700"
                                    }`}
                                  >
                                    {entry.assignedBy === "manager"
                                      ? "Assigned by Manager"
                                      : "Selected by Housekeeper"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                  <span>
                                    Completed Date:{" "}
                                    {formatDateDDMMYYYY(entry.timestamp)}
                                  </span>
                                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                    Completed
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="text-sm">No room history available</p>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setShowHistoryModal(false);
                      setSelectedCleanerForHistory(null);
                    }}
                  >
                    Close
                  </Button>
                </>
              );
            })()}
        </div>
      </Modal>

      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="font-semibold text-emerald-900">
              Room assigned successfully!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
