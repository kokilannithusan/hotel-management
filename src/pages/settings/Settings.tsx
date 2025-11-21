import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { useHotel } from "../../context/HotelContext";
import { generateId } from "../../utils/formatters";
import { navItems, NavItem } from "../../config/navigation";

type SettingsTab =
  | "hotel"
  | "role"
  | "hotelPrivileges"
  | "hotelRolePrivileges"
  | "userPrivileges"
  | "user"
  | "emailConfig";
interface PagePrivilege {
  read: boolean;
  write: boolean;
  maintain: boolean;
}

interface HotelRolePrivileges {
  [hotelId: string]: {
    [roleName: string]: {
      [pagePath: string]: PagePrivilege;
    };
  };
}

interface UserPrivilegeMatrix {
  [hotelId: string]: {
    [roleName: string]: {
      [userId: string]: {
        [pagePath: string]: PagePrivilege;
      };
    };
  };
}

interface HotelRecord {
  id: string;
  name: string;
  address: string;
  logoUrl: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  website: string;
  createdAt: string;
}

interface HotelForm {
  name: string;
  address: string;
  logoUrl: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  website: string;
}

interface UserForm {
  name: string;
  email: string;
  phone: string;
  hotelId: string;
  roleIds: string[];
}

interface RoleForm {
  name: string;
  hotelId: string;
}

interface RoleRecord {
  id: string;
  name: string;
  hotelId: string;
  createdAt: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  hotelId: string;
  roleIds: string[];
  createdAt: string;
}

interface EmailConfigRecord {
  id: string;
  hostname: string;
  email: string;
  password: string;
  port: string;
  protocol: string;
  sentEmail: string;
  displayName: string;
  ccEmail: string;
  createdAt: string;
}

interface EmailConfigForm {
  hostname: string;
  email: string;
  password: string;
  port: string;
  protocol: string;
  sentEmail: string;
  displayName: string;
  ccEmail: string;
}

const emptyHotelForm: HotelForm = {
  name: "",
  address: "",
  logoUrl: "",
  email: "",
  phone: "",
  city: "",
  country: "",
  website: "",
};

const emptyUserForm: UserForm = {
  name: "",
  email: "",
  phone: "",
  hotelId: "",
  roleIds: [],
};

const emptyRoleForm: RoleForm = {
  name: "",
  hotelId: "",
};

const emptyEmailConfigForm: EmailConfigForm = {
  hostname: "",
  email: "",
  password: "",
  port: "587",
  protocol: "SMTP",
  sentEmail: "",
  displayName: "",
  ccEmail: "",
};

const sections: { id: SettingsTab; label: string; description: string }[] = [
  {
    id: "hotel",
    label: "Hotel",
    description: "Create hotels, keep brand details in sync",
  },
  {
    id: "role",
    label: "Role Management",
    description: "Create and manage roles with hotel assignments",
  },
  {
    id: "hotelPrivileges",
    label: "Hotel Privileges",
    description: "Assign granular access per module for each hotel",
  },
  {
    id: "hotelRolePrivileges",
    label: "Hotel Role Privileges",
    description: "Configure permissions for roles within hotels",
  },
  {
    id: "userPrivileges",
    label: "User Privileges",
    description: "Assign sub-module access per hotel, role, and user",
  },
  {
    id: "user",
    label: "User",
    description: "Create and manage users with hotel and role assignments",
  },
  {
    id: "emailConfig",
    label: "Email Configuration",
    description: "Configure SMTP email settings for sending notifications",
  },
];

interface OperationPermissionRow {
  id: string;
  label: string;
  icon?: React.ReactNode;
  depth: number;
  parentPath?: string;
}

const flattenNavItems = (
  items: NavItem[],
  depth = 0,
  parentPath?: string
): OperationPermissionRow[] =>
  items.flatMap((item) => [
    {
      id: item.path,
      label: item.label,
      icon: item.icon,
      depth,
      parentPath,
    },
    ...(item.children
      ? flattenNavItems(item.children, depth + 1, item.path)
      : []),
  ]);

const operationMatrix = flattenNavItems(navItems);

const sectionRouteAliases: Record<string, SettingsTab> = {
  hotel: "hotel",
  role: "role",
  roles: "role",
  hotelPrivileges: "hotelPrivileges",
  operations: "hotelPrivileges",
  hotelRolePrivileges: "hotelRolePrivileges",
  userPrivileges: "userPrivileges",
  hotelRolePermissions: "hotelRolePrivileges",
  user: "user",
  addUser: "user",
  emailConfig: "emailConfig",
  email: "emailConfig",
};

// All pages use the same color theme for consistency
const sectionColors: Record<
  SettingsTab,
  { background: string; header: string }
> = {
  hotel: {
    background: "bg-slate-50",
    header: "from-blue-600 via-cyan-600 to-emerald-500",
  },
  role: {
    background: "bg-slate-50",
    header: "from-blue-600 via-cyan-600 to-emerald-500",
  },
  hotelPrivileges: {
    background: "bg-slate-50",
    header: "from-blue-600 via-cyan-600 to-emerald-500",
  },
  hotelRolePrivileges: {
    background: "bg-slate-50",
    header: "from-blue-600 via-cyan-600 to-emerald-500",
  },
  userPrivileges: {
    background: "bg-slate-50",
    header: "from-blue-600 via-cyan-600 to-emerald-500",
  },
  user: {
    background: "bg-slate-50",
    header: "from-blue-600 via-cyan-600 to-emerald-500",
  },
  emailConfig: {
    background: "bg-slate-50",
    header: "from-blue-600 via-cyan-600 to-emerald-500",
  },
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const Settings: React.FC = () => {
  const { state } = useHotel();
  const navigate = useNavigate();
  const location = useLocation();
  const { section } = useParams<{ section?: SettingsTab }>();

  const activeSection: SettingsTab = useMemo(() => {
    const pathSection =
      location.pathname.split("/settings/")[1]?.split("/")[0] ?? "";
    const currentSection = section || pathSection;
    return sectionRouteAliases[currentSection] ?? "hotel";
  }, [section, location.pathname]);

  useEffect(() => {
    if (!section) {
      navigate("/settings/hotel", { replace: true });
      return;
    }
    if (!sectionRouteAliases[section]) {
      navigate("/settings/hotel", { replace: true });
    }
  }, [section, navigate]);

  const [hotels, setHotels] = useState<HotelRecord[]>(() => {
    if (state.settings) {
      return [
        {
          id: state.settings.id,
          name: state.settings.name,
          address: state.settings.address,
          logoUrl: "",
          city: state.settings.city,
          country: state.settings.country,
          phone: state.settings.phone,
          email: state.settings.email,
          website: state.settings.website ?? "",
          createdAt: new Date().toISOString(),
        },
      ];
    }
    return [];
  });

  const [createForm, setCreateForm] = useState<HotelForm>(emptyHotelForm);
  const [editForm, setEditForm] = useState<HotelForm>(emptyHotelForm);
  const [editingHotel, setEditingHotel] = useState<HotelRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Role management state (new CRUD system)
  const [roleRecords, setRoleRecords] = useState<RoleRecord[]>([]);
  // Role form state
  const [roleForm, setRoleForm] = useState<RoleForm>(emptyRoleForm);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Hotel-Role relationships: which roles belong to which hotel
  const [hotelRoles, setHotelRoles] = useState<Record<string, string[]>>({});

  // Privileges per hotel-role-page combination
  const [hotelRolePrivileges, setHotelRolePrivileges] =
    useState<HotelRolePrivileges>({});

  // Selected hotel for Hotel Privileges page (renamed from operations)
  const [selectedHotelForPrivileges, setSelectedHotelForPrivileges] =
    useState<string>("");

  // Store assigned pages per hotel
  const [hotelAssignedPages, setHotelAssignedPages] = useState<
    Record<string, string[]>
  >({});

  // Selected hotel for Hotel Assign Role page
  const [selectedHotelForAssignRole, setSelectedHotelForAssignRole] =
    useState<string>("");

  // Selected hotel for Hotel Role Privileges page
  const [
    selectedHotelForRolePrivilegesPage,
    setSelectedHotelForRolePrivilegesPage,
  ] = useState<string>("");
  const [selectedRoleForPrivileges, setSelectedRoleForPrivileges] =
    useState<string>("");

  // User privileges filter state
  const [selectedHotelForUserPrivileges, setSelectedHotelForUserPrivileges] =
    useState<string>("");
  const [selectedRoleForUserPrivileges, setSelectedRoleForUserPrivileges] =
    useState<string>("");
  const [selectedUserForUserPrivileges, setSelectedUserForUserPrivileges] =
    useState<string>("");
  const [userPrivilegeMatrix, setUserPrivilegeMatrix] =
    useState<UserPrivilegeMatrix>({});

  // User form state
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement | null>(null);

  // Email Configuration state
  const [emailConfigs, setEmailConfigs] = useState<EmailConfigRecord[]>([]);
  const [emailConfigForm, setEmailConfigForm] =
    useState<EmailConfigForm>(emptyEmailConfigForm);
  const [showEmailConfigModal, setShowEmailConfigModal] = useState(false);
  const [editingEmailConfig, setEditingEmailConfig] =
    useState<EmailConfigRecord | null>(null);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!selectedHotelForRolePrivilegesPage) {
      setSelectedRoleForPrivileges("");
      return;
    }

    const allowedRoles = hotelRoles[selectedHotelForRolePrivilegesPage] || [];

    setSelectedRoleForPrivileges((prev) =>
      prev && allowedRoles.includes(prev) ? prev : ""
    );
  }, [hotelRoles, selectedHotelForRolePrivilegesPage]);

  useEffect(() => {
    if (!selectedHotelForUserPrivileges) {
      setSelectedRoleForUserPrivileges("");
      return;
    }
    const allowedRoles = hotelRoles[selectedHotelForUserPrivileges] || [];
    setSelectedRoleForUserPrivileges((prev) =>
      prev && allowedRoles.includes(prev) ? prev : ""
    );
  }, [hotelRoles, selectedHotelForUserPrivileges]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        roleDropdownRef.current &&
        !roleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setIsRoleDropdownOpen(false);
  }, [userForm.hotelId]);

  const resetCreateForm = () => setCreateForm(emptyHotelForm);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingHotel(null);
    setEditForm(emptyHotelForm);
  };

  const handleCreateHotel = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createForm.logoUrl) {
      alert("Please upload a hotel logo image.");
      return;
    }
    const payload: HotelRecord = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...createForm,
    };
    setHotels((prev) => [payload, ...prev]);
    resetCreateForm();
    setShowCreateModal(false);
  };

  const handleOpenEdit = (hotel: HotelRecord) => {
    setEditingHotel(hotel);
    setEditForm({
      name: hotel.name,
      address: hotel.address,
      logoUrl: hotel.logoUrl,
      email: hotel.email,
      phone: hotel.phone,
      city: hotel.city,
      country: hotel.country,
      website: hotel.website,
    });
    setShowEditModal(true);
  };

  const handleUpdateHotel = () => {
    if (!editingHotel) return;
    setHotels((prev) =>
      prev.map((hotel) =>
        hotel.id === editingHotel.id ? { ...hotel, ...editForm } : hotel
      )
    );
    closeEditModal();
  };

  const handleDeleteHotel = (hotelId: string) => {
    if (!window.confirm("Are you sure you want to delete this hotel?")) {
      return;
    }

    setHotels((prev) => prev.filter((hotel) => hotel.id !== hotelId));
    setHotelRoles((prev) => {
      const updated = { ...prev };
      delete updated[hotelId];
      return updated;
    });
    setHotelAssignedPages((prev) => {
      const updated = { ...prev };
      delete updated[hotelId];
      return updated;
    });
    setHotelRolePrivileges((prev) => {
      const updated = { ...prev };
      delete updated[hotelId];
      return updated;
    });
    setUserPrivilegeMatrix((prev) => {
      const updated = { ...prev };
      delete updated[hotelId];
      return updated;
    });
    setUsers((prev) => prev.filter((user) => user.hotelId !== hotelId));

    if (selectedHotelForAssignRole === hotelId) {
      setSelectedHotelForAssignRole("");
    }
    if (selectedHotelForPrivileges === hotelId) {
      setSelectedHotelForPrivileges("");
    }
    if (selectedHotelForRolePrivilegesPage === hotelId) {
      setSelectedHotelForRolePrivilegesPage("");
      setSelectedRoleForPrivileges("");
    }
    setUserForm((prev) =>
      prev.hotelId === hotelId ? { ...prev, hotelId: "", roleIds: [] } : prev
    );
  };

  const handleHotelLogoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    formType: "create" | "edit"
  ) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, GIF).");
      input.value = "";
      return;
    }
    const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSizeInBytes) {
      alert("Image is too large. Please upload a file smaller than 2MB.");
      input.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const logoData = typeof reader.result === "string" ? reader.result : "";
      if (formType === "create") {
        setCreateForm((prev) => ({ ...prev, logoUrl: logoData }));
      } else {
        setEditForm((prev) => ({ ...prev, logoUrl: logoData }));
      }
      input.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveHotelLogo = (formType: "create" | "edit") => {
    if (formType === "create") {
      setCreateForm((prev) => ({ ...prev, logoUrl: "" }));
    } else {
      setEditForm((prev) => ({ ...prev, logoUrl: "" }));
    }
  };

  const renderHotelTab = () => (
    <div className="space-y-8">
      <Card
        title="Hotels"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 hidden md:block">
              {hotels.length} property{hotels.length === 1 ? "" : "ies"}
            </span>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center text-lg font-bold"
              aria-label="Add Hotel"
            >
              +
            </Button>
          </div>
        }
      >
        {hotels.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="text-5xl">🏨</div>
            <p className="text-base font-semibold text-slate-700">
              No hotels created yet
            </p>
            <p className="max-w-md text-sm text-slate-500">
              Click the + button above to add your first hotel. It will appear
              here with edit and delete options.
            </p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto md:mx-0">
            <table className="min-w-[1000px] w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-slate-500">
                  {[
                    "Hotel Name",
                    "Logo",
                    "Address",
                    "Email",
                    "Phone Number",
                    "City",
                    "Country",
                    "Website",
                    "Created Date",
                    "Action",
                  ].map((header) => (
                    <th key={header} className="px-4 py-3">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {hotels.map((hotel) => (
                  <tr
                    key={hotel.id}
                    className="border-t border-slate-100 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {hotel.name}
                    </td>
                    <td className="px-4 py-4">
                      {hotel.logoUrl ? (
                        <img
                          src={hotel.logoUrl}
                          alt={`${hotel.name} logo`}
                          className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Not set</span>
                      )}
                    </td>
                    <td className="px-4 py-4">{hotel.address}</td>
                    <td className="px-4 py-4 text-blue-600">{hotel.email}</td>
                    <td className="px-4 py-4">{hotel.phone}</td>
                    <td className="px-4 py-4">{hotel.city}</td>
                    <td className="px-4 py-4">{hotel.country}</td>
                    <td className="px-4 py-4">
                      <a
                        href={hotel.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {hotel.website}
                      </a>
                    </td>
                    <td className="px-4 py-4">{formatDate(hotel.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(hotel)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteHotel(hotel.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  // Role CRUD handlers
  const handleCreateRole = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: RoleRecord = {
      id: generateId(),
      name: roleForm.name,
      hotelId: roleForm.hotelId,
      createdAt: new Date().toISOString(),
    };
    setRoleRecords((prev) => [payload, ...prev]);
    setRoleForm(emptyRoleForm);
    setShowRoleModal(false);
  };

  const handleOpenEditRole = (role: RoleRecord) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, hotelId: role.hotelId });
    setShowRoleModal(true);
  };

  const handleUpdateRole = () => {
    if (!editingRole) return;
    setRoleRecords((prev) =>
      prev.map((role) =>
        role.id === editingRole.id
          ? { ...role, name: roleForm.name, hotelId: roleForm.hotelId }
          : role
      )
    );
    setEditingRole(null);
    setRoleForm(emptyRoleForm);
    setShowRoleModal(false);
  };

  const handleDeleteRole = (roleId: string) => {
    const roleToDelete = roleRecords.find((role) => role.id === roleId);
    if (!roleToDelete) {
      return;
    }

    if (!window.confirm("Are you sure you want to delete this role?")) {
      return;
    }

    setRoleRecords((prev) => prev.filter((role) => role.id !== roleId));
    setHotelRoles((prev) => {
      const updatedEntries = Object.entries(prev).reduce(
        (acc, [hotelId, rolesForHotel]) => {
          const filteredRoles = rolesForHotel.filter(
            (roleName) => roleName !== roleToDelete.name
          );
          if (filteredRoles.length > 0) {
            acc[hotelId] = filteredRoles;
          }
          return acc;
        },
        {} as Record<string, string[]>
      );
      return updatedEntries;
    });
    setHotelRolePrivileges((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((hotelId) => {
        if (updated[hotelId]?.[roleToDelete.name]) {
          const { [roleToDelete.name]: _removed, ...restRoles } =
            updated[hotelId];
          if (Object.keys(restRoles).length === 0) {
            delete updated[hotelId];
          } else {
            updated[hotelId] = restRoles;
          }
        }
      });
      return updated;
    });
    setUserPrivilegeMatrix((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((hotelId) => {
        if (updated[hotelId]?.[roleToDelete.name]) {
          const { [roleToDelete.name]: _removed, ...restRoles } =
            updated[hotelId];
          if (Object.keys(restRoles).length === 0) {
            delete updated[hotelId];
          } else {
            updated[hotelId] = restRoles;
          }
        }
      });
      return updated;
    });
    setUsers((prev) =>
      prev.map((user) =>
        user.roleIds.includes(roleId)
          ? { ...user, roleIds: user.roleIds.filter((id) => id !== roleId) }
          : user
      )
    );
    setSelectedRoleForPrivileges((prev) =>
      prev === roleToDelete.name ? "" : prev
    );
    setUserForm((prev) =>
      prev.roleIds.includes(roleId)
        ? { ...prev, roleIds: prev.roleIds.filter((id) => id !== roleId) }
        : prev
    );
  };

  const renderRoleTab = () => (
    <div className="space-y-6">
      <Card
        title="Role Management"
        actions={
          <Button
            onClick={() => {
              setEditingRole(null);
              setRoleForm(emptyRoleForm);
              setShowRoleModal(true);
            }}
          >
            Add Role
          </Button>
        }
      >
        {roleRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="text-5xl">👤</div>
            <p className="text-base font-semibold text-slate-700">
              No roles created yet
            </p>
            <p className="max-w-md text-sm text-slate-500">
              Click "Add Role" to create your first role.
            </p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto md:mx-0">
            <table className="min-w-[600px] w-full text-left">
              <thead>
                <tr className="text-xs uppercase tracking-widest text-slate-500">
                  <th className="px-4 py-3">Hotel</th>
                  <th className="px-4 py-3">Role Name</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700">
                {roleRecords.map((role) => {
                  const hotel = hotels.find((h) => h.id === role.hotelId);
                  return (
                    <tr
                      key={role.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <span className="font-medium text-slate-900">
                          {hotel?.name || "Unknown Hotel"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {role.name}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDate(role.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditRole(role)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );

  const handleTogglePagePrivilege = (
    hotelId: string,
    roleName: string,
    pagePath: string,
    privilegeType: keyof PagePrivilege
  ) => {
    setHotelRolePrivileges((prev) => {
      const hotelPrivs = prev[hotelId] || {};
      const rolePrivs = hotelPrivs[roleName] || {};
      const pagePrivs = rolePrivs[pagePath] || {
        read: false,
        write: false,
        maintain: false,
      };

      return {
        ...prev,
        [hotelId]: {
          ...hotelPrivs,
          [roleName]: {
            ...rolePrivs,
            [pagePath]: {
              ...pagePrivs,
              [privilegeType]: !pagePrivs[privilegeType],
            },
          },
        },
      };
    });
  };

  const handleToggleUserPrivilege = (
    hotelId: string,
    roleName: string,
    userId: string,
    pagePath: string,
    privilegeType: keyof PagePrivilege
  ) => {
    if (!hotelId || !roleName || !userId) {
      return;
    }
    setUserPrivilegeMatrix((prev) => {
      const hotelPrivileges = prev[hotelId] || {};
      const rolePrivileges = hotelPrivileges[roleName] || {};
      const userPrivileges = rolePrivileges[userId] || {};
      const currentPagePrivileges = userPrivileges[pagePath] || {
        read: false,
        write: false,
        maintain: false,
      };

      return {
        ...prev,
        [hotelId]: {
          ...hotelPrivileges,
          [roleName]: {
            ...rolePrivileges,
            [userId]: {
              ...userPrivileges,
              [pagePath]: {
                ...currentPagePrivileges,
                [privilegeType]: !currentPagePrivileges[privilegeType],
              },
            },
          },
        },
      };
    });
  };

  const handleSaveUserPrivileges = () => {
    if (
      !selectedHotelForUserPrivileges ||
      !selectedRoleForUserPrivileges ||
      !selectedUserForUserPrivileges
    ) {
      alert("Please select hotel, role, and user before saving.");
      return;
    }
    alert("User privileges saved successfully!");
  };

  const handleTogglePageAssignment = (hotelId: string, pagePath: string) => {
    setHotelAssignedPages((prev) => {
      const currentPages = prev[hotelId] || [];
      const isAssigned = currentPages.includes(pagePath);

      return {
        ...prev,
        [hotelId]: isAssigned
          ? currentPages.filter((path) => path !== pagePath)
          : [...currentPages, pagePath],
      };
    });
  };

  const handleSavePageAssignments = () => {
    if (!selectedHotelForPrivileges) {
      alert("Please select a hotel first.");
      return;
    }
    alert("Page assignments saved successfully!");
  };

  const renderHotelPrivilegesTab = () => {
    const assignedPages = selectedHotelForPrivileges
      ? hotelAssignedPages[selectedHotelForPrivileges] || []
      : [];
    return (
      <Card title="Page Privileges">
        <div className="space-y-6">
          <div className="flex flex-row flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[220px]">
              <Select
                label="Select Hotel"
                value={selectedHotelForPrivileges}
                onChange={(e) => setSelectedHotelForPrivileges(e.target.value)}
                options={[
                  { value: "", label: "Select a hotel" },
                  ...hotels.map((hotel) => ({
                    value: hotel.id,
                    label: hotel.name,
                  })),
                ]}
              />
            </div>
            <div className="flex justify-end w-full lg:w-auto">
              <Button
                onClick={handleSavePageAssignments}
                disabled={!selectedHotelForPrivileges}
              >
                Save Selections
              </Button>
            </div>
          </div>

          {!selectedHotelForPrivileges ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
              Please select a hotel to view and configure page privileges.
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">
                Select the pages you want to assign to this hotel by checking
                the boxes below.
              </p>

              <div className="mt-6 rounded-2xl bg-white shadow-sm">
                <div className="max-h-[65vh] overflow-auto rounded-2xl">
                  <div className="min-w-full overflow-x-auto">
                    <table className="min-w-[900px] w-full table-fixed border-collapse">
                      <thead className="sticky top-0 bg-slate-50/90 backdrop-blur">
                        <tr className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                          <th className="px-4 py-3 text-left">Submodules</th>
                          <th className="px-4 py-3 text-center">Assign</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-slate-700">
                        {operationMatrix
                          .filter((operation) => operation.depth > 0) // Only show submodules
                          .map((operation) => {
                            // Find parent module label
                            const parentModule = operationMatrix.find(
                              (op) =>
                                op.id === operation.parentPath && op.depth === 0
                            );
                            const parentLabel = parentModule
                              ? parentModule.label
                              : "";
                            const isAssigned = assignedPages.includes(
                              operation.id
                            );

                            return (
                              <tr
                                key={operation.id}
                                className="transition-colors hover:bg-slate-50/70"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-4">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                      {operation.icon}
                                    </span>
                                    <div>
                                      <p className="text-base font-bold text-slate-900">
                                        {operation.label}
                                        {parentLabel && (
                                          <span className="text-slate-600 font-semibold ml-2 text-sm">
                                            ({parentLabel})
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center justify-center">
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={() =>
                                        handleTogglePageAssignment(
                                          selectedHotelForPrivileges,
                                          operation.id
                                        )
                                      }
                                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    );
  };

  const renderHotelRolePrivilegesTab = () => {
    // Get roles from Role Management for the selected hotel
    const rolesForHotel = selectedHotelForRolePrivilegesPage
      ? roleRecords
          .filter((role) => role.hotelId === selectedHotelForRolePrivilegesPage)
          .map((role) => role.name)
      : [];

    const currentPrivileges =
      selectedHotelForRolePrivilegesPage && selectedRoleForPrivileges
        ? hotelRolePrivileges[selectedHotelForRolePrivilegesPage]?.[
            selectedRoleForPrivileges
          ] || {}
        : {};

    // Get assigned pages for the hotel
    const assignedPagesForHotel = selectedHotelForRolePrivilegesPage
      ? hotelAssignedPages[selectedHotelForRolePrivilegesPage] || []
      : [];

    const handleSavePrivileges = () => {
      if (!selectedHotelForRolePrivilegesPage || !selectedRoleForPrivileges) {
        alert("Please select both a hotel and a role.");
        return;
      }
      alert("Privileges saved successfully!");
    };

    return (
      <div className="space-y-6">
        <Card title="Role Permissions">
          <div className="space-y-6">
            <div className="flex flex-row flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[220px]">
                <Select
                  label="Select Hotel"
                  value={selectedHotelForRolePrivilegesPage}
                  onChange={(e) => {
                    setSelectedHotelForRolePrivilegesPage(e.target.value);
                    setSelectedRoleForPrivileges("");
                  }}
                  options={[
                    { value: "", label: "Select a hotel" },
                    ...hotels.map((hotel) => ({
                      value: hotel.id,
                      label: hotel.name,
                    })),
                  ]}
                />
              </div>
              <div className="flex-1 min-w-[220px]">
                <Select
                  label="Select Role"
                  value={selectedRoleForPrivileges}
                  onChange={(e) => setSelectedRoleForPrivileges(e.target.value)}
                  disabled={
                    !selectedHotelForRolePrivilegesPage ||
                    rolesForHotel.length === 0
                  }
                  options={[
                    {
                      value: "",
                      label: !selectedHotelForRolePrivilegesPage
                        ? "Select a hotel first"
                        : rolesForHotel.length > 0
                        ? "Select a role"
                        : "Assign roles to this hotel first",
                    },
                    ...rolesForHotel.map((roleName) => ({
                      value: roleName,
                      label: roleName,
                    })),
                  ]}
                />
              </div>
            </div>

            {!selectedHotelForRolePrivilegesPage ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                Please select a hotel first.
              </div>
            ) : rolesForHotel.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                No roles have been assigned to this hotel yet. Please assign
                roles in the Hotel Assign Role page first.
              </div>
            ) : !selectedRoleForPrivileges ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                Please select a role to configure permissions.
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-white shadow-sm">
                  <div className="max-h-[60vh] overflow-auto">
                    <div className="min-w-full overflow-x-auto">
                      <table className="min-w-[900px] w-full border-collapse">
                        <thead className="sticky top-0 bg-slate-50/90 backdrop-blur">
                          <tr className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            <th className="px-4 py-3 text-left">
                              Sub Module Name
                            </th>
                            <th className="px-4 py-3 text-center">Read</th>
                            <th className="px-4 py-3 text-center">Write</th>
                            <th className="px-4 py-3 text-center">Maintain</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700">
                          {operationMatrix
                            .filter(
                              (operation) =>
                                operation.depth > 0 &&
                                assignedPagesForHotel.includes(operation.id)
                            )
                            .map((operation) => {
                              const pagePrivs = currentPrivileges[
                                operation.id
                              ] || {
                                read: false,
                                write: false,
                                maintain: false,
                              };
                              return (
                                <tr
                                  key={operation.id}
                                  className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-4">
                                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        {operation.icon}
                                      </span>
                                      <div>
                                        <p className="text-base font-bold text-slate-900">
                                          {operation.label}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  {(["read", "write", "maintain"] as const).map(
                                    (privType) => (
                                      <td key={privType} className="px-4 py-3">
                                        <div className="flex items-center justify-center">
                                          <input
                                            type="checkbox"
                                            checked={pagePrivs[privType]}
                                            onChange={() =>
                                              handleTogglePagePrivilege(
                                                selectedHotelForRolePrivilegesPage,
                                                selectedRoleForPrivileges,
                                                operation.id,
                                                privType
                                              )
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                          />
                                        </div>
                                      </td>
                                    )
                                  )}
                                </tr>
                              );
                            })}
                          {assignedPagesForHotel.length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="px-4 py-8 text-center text-slate-500"
                              >
                                No pages have been assigned to this hotel yet.
                                Please assign pages in the Hotel Privileges tab
                                first.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button onClick={handleSavePrivileges}>
                    Save Privileges
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderUserPrivilegesTab = () => {
    // Get roles from Role Management for the selected hotel
    const rolesForSelectedHotel = selectedHotelForUserPrivileges
      ? roleRecords
          .filter((role) => role.hotelId === selectedHotelForUserPrivileges)
          .map((role) => role.name)
      : [];
    const assignedPagesForHotel = selectedHotelForUserPrivileges
      ? hotelAssignedPages[selectedHotelForUserPrivileges] || []
      : [];
    const currentPrivileges =
      selectedHotelForUserPrivileges &&
      selectedRoleForUserPrivileges &&
      selectedUserForUserPrivileges
        ? userPrivilegeMatrix[selectedHotelForUserPrivileges]?.[
            selectedRoleForUserPrivileges
          ]?.[selectedUserForUserPrivileges] || {}
        : {};

    return (
      <div className="space-y-6">
        <Card title="User Privilege Matrix">
          <div className="space-y-6">
            <div className="flex flex-row flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[220px]">
                <Select
                  label="Select Hotel"
                  value={selectedHotelForUserPrivileges}
                  onChange={(e) => {
                    setSelectedHotelForUserPrivileges(e.target.value);
                    setSelectedRoleForUserPrivileges("");
                    setSelectedUserForUserPrivileges("");
                  }}
                  options={[
                    { value: "", label: "Select a hotel" },
                    ...hotels.map((hotel) => ({
                      value: hotel.id,
                      label: hotel.name,
                    })),
                  ]}
                />
              </div>
              <div className="flex-1 min-w-[220px]">
                <Select
                  label="Select Role"
                  value={selectedRoleForUserPrivileges}
                  onChange={(e) => {
                    setSelectedRoleForUserPrivileges(e.target.value);
                    setSelectedUserForUserPrivileges("");
                  }}
                  disabled={
                    !selectedHotelForUserPrivileges ||
                    rolesForSelectedHotel.length === 0
                  }
                  options={[
                    {
                      value: "",
                      label: !selectedHotelForUserPrivileges
                        ? "Select a hotel first"
                        : rolesForSelectedHotel.length > 0
                        ? "Select a role"
                        : "Assign roles to this hotel first",
                    },
                    ...rolesForSelectedHotel.map((role) => ({
                      value: role,
                      label: role,
                    })),
                  ]}
                />
              </div>
              <div className="flex-1 min-w-[220px]">
                <Select
                  label="Select User"
                  value={selectedUserForUserPrivileges}
                  onChange={(e) =>
                    setSelectedUserForUserPrivileges(e.target.value)
                  }
                  disabled={users.length === 0}
                  options={[
                    {
                      value: "",
                      label:
                        users.length === 0 ? "No users found" : "Select a user",
                    },
                    ...users.map((user) => ({
                      value: user.id,
                      label: user.name,
                    })),
                  ]}
                />
              </div>
            </div>

            {!selectedHotelForUserPrivileges ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                Please select a hotel to continue.
              </div>
            ) : rolesForSelectedHotel.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                No roles have been assigned to this hotel yet. Please assign
                roles first.
              </div>
            ) : !selectedRoleForUserPrivileges ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                Select a role to configure privileges.
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                No users have been created yet. Please add a user first.
              </div>
            ) : !selectedUserForUserPrivileges ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                Choose a user to assign privileges.
              </div>
            ) : assignedPagesForHotel.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
                No sub-modules have been assigned to this hotel yet. Configure
                them in Hotel Privileges first.
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-white shadow-sm">
                  <div className="max-h-[60vh] overflow-auto">
                    <div className="min-w-full overflow-x-auto">
                      <table className="min-w-[900px] w-full border-collapse">
                        <thead className="sticky top-0 bg-slate-50/90 backdrop-blur">
                          <tr className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                            <th className="px-4 py-3 text-left">
                              Sub Module Name
                            </th>
                            <th className="px-4 py-3 text-center">Read</th>
                            <th className="px-4 py-3 text-center">Write</th>
                            <th className="px-4 py-3 text-center">Maintain</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700">
                          {operationMatrix
                            .filter(
                              (operation) =>
                                operation.depth > 0 &&
                                assignedPagesForHotel.includes(operation.id)
                            )
                            .map((operation) => {
                              const pagePrivs = currentPrivileges[
                                operation.id
                              ] || {
                                read: false,
                                write: false,
                                maintain: false,
                              };
                              return (
                                <tr
                                  key={operation.id}
                                  className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-4">
                                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        {operation.icon}
                                      </span>
                                      <div>
                                        <p className="text-base font-bold text-slate-900">
                                          {operation.label}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  {(["read", "write", "maintain"] as const).map(
                                    (privType) => (
                                      <td key={privType} className="px-4 py-3">
                                        <div className="flex items-center justify-center">
                                          <input
                                            type="checkbox"
                                            checked={pagePrivs[privType]}
                                            onChange={() =>
                                              handleToggleUserPrivilege(
                                                selectedHotelForUserPrivileges,
                                                selectedRoleForUserPrivileges,
                                                selectedUserForUserPrivileges,
                                                operation.id,
                                                privType
                                              )
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                          />
                                        </div>
                                      </td>
                                    )
                                  )}
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveUserPrivileges}>
                    Save Privileges
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const handleCreateUser = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (userForm.roleIds.length === 0) {
      alert("Please assign at least one role to the user.");
      return;
    }
    const payload: UserRecord = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      name: userForm.name,
      email: userForm.email,
      phone: userForm.phone,
      hotelId: userForm.hotelId,
      roleIds: userForm.roleIds,
    };
    setUsers((prev) => [payload, ...prev]);
    setUserForm(emptyUserForm);
    setShowUserModal(false);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    if (userForm.roleIds.length === 0) {
      alert("Please assign at least one role to the user.");
      return;
    }
    setUsers((prev) =>
      prev.map((user) =>
        user.id === editingUser.id
          ? {
              ...user,
              name: userForm.name,
              email: userForm.email,
              phone: userForm.phone,
              hotelId: userForm.hotelId,
              roleIds: userForm.roleIds,
            }
          : user
      )
    );
    setEditingUser(null);
    setUserForm(emptyUserForm);
    setShowUserModal(false);
  };

  const handleOpenEditUser = (user: UserRecord) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      hotelId: user.hotelId,
      roleIds: user.roleIds,
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    }
  };

  const getUserRolesForUser = (user: UserRecord) =>
    roleRecords.filter((role) => user.roleIds.includes(role.id));

  const getMergedPrivilegesForUser = (
    hotelId: string,
    roles: RoleRecord[]
  ): Record<string, PagePrivilege> => {
    if (!hotelId || roles.length === 0) {
      return {};
    }
    return roles.reduce<Record<string, PagePrivilege>>((acc, role) => {
      const rolePrivileges = hotelRolePrivileges[hotelId]?.[role.name] || {};
      Object.entries(rolePrivileges).forEach(([pagePath, permissions]) => {
        const current = acc[pagePath] || {
          read: false,
          write: false,
          maintain: false,
        };
        acc[pagePath] = {
          read: current.read || permissions.read,
          write: current.write || permissions.write,
          maintain: current.maintain || permissions.maintain,
        };
      });
      return acc;
    }, {});
  };

  const handleSendPrivilegeEmail = (user: UserRecord) => {
    const userRoles = getUserRolesForUser(user);
    const userHotel = hotels.find((h) => h.id === user.hotelId);
    const assignedPages = user.hotelId
      ? hotelAssignedPages[user.hotelId] || []
      : [];
    const privileges =
      user.hotelId && userRoles.length > 0
        ? getMergedPrivilegesForUser(user.hotelId, userRoles)
        : {};

    const pagesWithPrivileges = operationMatrix
      .filter((operation) => {
        if (operation.depth === 0) return false;
        return assignedPages.includes(operation.id);
      })
      .map((operation) => {
        const pagePrivs = privileges[operation.id] || {
          read: false,
          write: false,
          maintain: false,
        };
        const hasAnyPrivilege =
          pagePrivs.read || pagePrivs.write || pagePrivs.maintain;
        if (!hasAnyPrivilege) return null;

        const privs = [];
        if (pagePrivs.read) privs.push("Read");
        if (pagePrivs.write) privs.push("Write");
        if (pagePrivs.maintain) privs.push("Maintain");

        return {
          page: operation.label,
          privileges: privs.join(", "),
        };
      })
      .filter((page) => page !== null);

    const emailSubject = `User Privileges - ${user.name}`;
    const roleLabel =
      userRoles.length > 0
        ? userRoles.map((role) => role.name).join(", ")
        : "N/A";
    const emailBody = `
Dear ${user.name},

These sub-modules are allocated for you.

Role(s): ${roleLabel}
Hotel: ${userHotel?.name || "N/A"}

Assigned Sub-Modules:
${pagesWithPrivileges
  .map((page, index) => `${index + 1}. ${page?.page}: ${page?.privileges}`)
  .join("\n")}

Best regards,
Hotel Management System
    `.trim();

    const mailtoLink = `mailto:${user.email}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
    alert(
      `Email client opened for ${user.email} with user privileges information.`
    );
  };

  const getRoleOptionsForHotel = (hotelId: string) => {
    if (!hotelId) {
      return [];
    }
    // Get roles from Role Management for the selected hotel
    return roleRecords
      .filter((role) => role.hotelId === hotelId)
      .map((role) => ({ value: role.id, label: role.name }));
  };
  const handleToggleRoleSelection = (roleId: string) => {
    setUserForm((prev) => {
      const isSelected = prev.roleIds.includes(roleId);
      return {
        ...prev,
        roleIds: isSelected
          ? prev.roleIds.filter((id) => id !== roleId)
          : [...prev.roleIds, roleId],
      };
    });
  };

  // Email Configuration CRUD handlers
  const handleCreateEmailConfig = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload: EmailConfigRecord = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...emailConfigForm,
    };
    setEmailConfigs((prev) => [payload, ...prev]);
    setEmailConfigForm(emptyEmailConfigForm);
    setShowEmailConfigModal(false);
  };

  const handleOpenEditEmailConfig = (config: EmailConfigRecord) => {
    setEditingEmailConfig(config);
    setEmailConfigForm({
      hostname: config.hostname,
      email: config.email,
      password: config.password,
      port: config.port,
      protocol: config.protocol,
      sentEmail: config.sentEmail,
      displayName: config.displayName,
      ccEmail: config.ccEmail,
    });
    setCcEnabled(!!config.ccEmail);
    setShowEmailConfigModal(true);
  };

  const handleUpdateEmailConfig = () => {
    if (!editingEmailConfig) return;
    setEmailConfigs((prev) =>
      prev.map((config) =>
        config.id === editingEmailConfig.id
          ? {
              ...config,
              ...emailConfigForm,
            }
          : config
      )
    );
    setEditingEmailConfig(null);
    setEmailConfigForm(emptyEmailConfigForm);
    setShowEmailConfigModal(false);
  };

  const handleDeleteEmailConfig = (configId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this email configuration?"
      )
    ) {
      setEmailConfigs((prev) =>
        prev.filter((config) => config.id !== configId)
      );
    }
  };

  const closeEmailConfigModal = () => {
    setShowEmailConfigModal(false);
    setEditingEmailConfig(null);
    setEmailConfigForm(emptyEmailConfigForm);
    setShowEmailPassword(false);
    setCcEnabled(false);
  };

  const renderUserTab = () => {
    // Get sub-modules for a user (after creation)
    const getUserSubModules = (user: UserRecord) => {
      const userRoles = getUserRolesForUser(user);
      if (!user.hotelId || userRoles.length === 0) return [];

      const assignedPages = hotelAssignedPages[user.hotelId] || [];
      const privileges = getMergedPrivilegesForUser(user.hotelId, userRoles);

      return operationMatrix
        .filter((operation) => {
          if (operation.depth === 0) return false;
          return assignedPages.includes(operation.id);
        })
        .map((operation) => {
          const pagePrivs = privileges[operation.id] || {
            read: false,
            write: false,
            maintain: false,
          };
          const hasAnyPrivilege =
            pagePrivs.read || pagePrivs.write || pagePrivs.maintain;
          if (!hasAnyPrivilege) return null;

          const privs = [];
          if (pagePrivs.read) privs.push("Read");
          if (pagePrivs.write) privs.push("Write");
          if (pagePrivs.maintain) privs.push("Maintain");

          return {
            page: operation.label,
            privileges: privs.join(", "),
          };
        })
        .filter((page) => page !== null);
    };

    return (
      <div className="space-y-6">
        <Card
          title="User Management"
          actions={
            <Button
              onClick={() => {
                setEditingUser(null);
                setUserForm(emptyUserForm);
                setShowUserModal(true);
              }}
            >
              Add User
            </Button>
          }
        >
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="text-5xl">👤</div>
              <p className="text-base font-semibold text-slate-700">
                No users created yet
              </p>
              <p className="max-w-md text-sm text-slate-500">
                Click "Add User" to create your first user.
              </p>
            </div>
          ) : (
            <div className="-mx-4 overflow-x-auto md:mx-0">
              <table className="min-w-[1000px] w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Hotel</th>
                    <th className="px-4 py-3">Role(s)</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {users.map((user) => {
                    const userHotel = hotels.find((h) => h.id === user.hotelId);
                    const userRoles = getUserRolesForUser(user);
                    const subModules = getUserSubModules(user);

                    return (
                      <React.Fragment key={user.id}>
                        <tr className="border-t border-slate-100 hover:bg-slate-50/70">
                          <td className="px-4 py-4 font-semibold text-slate-900">
                            {user.name}
                          </td>
                          <td className="px-4 py-4 text-blue-600">
                            {user.email}
                          </td>
                          <td className="px-4 py-4">{user.phone}</td>
                          <td className="px-4 py-4">
                            {userHotel?.name || "N/A"}
                          </td>
                          <td className="px-4 py-4">
                            {userRoles.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {userRoles.map((role) => (
                                  <span
                                    key={role.id}
                                    className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold"
                                  >
                                    {role.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditUser(user)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Delete
                              </Button>
                              {subModules.length > 0 && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleSendPrivilegeEmail(user)}
                                >
                                  Send Privilege Email
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {subModules.length > 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-4 bg-slate-50">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-slate-600 mb-2">
                                  Sub-Modules Assigned:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {subModules.map((module, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                                    >
                                      {module?.page} ({module?.privileges})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderEmailConfigTab = () => {
    return (
      <div className="space-y-6">
        <Card
          title="Email Configuration"
          actions={
            <Button
              onClick={() => {
                setEditingEmailConfig(null);
                setEmailConfigForm(emptyEmailConfigForm);
                setShowEmailPassword(false);
                setShowEmailConfigModal(true);
              }}
            >
              Add Email Config
            </Button>
          }
        >
          {emailConfigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="text-5xl">📧</div>
              <p className="text-base font-semibold text-slate-700">
                No email configurations yet
              </p>
              <p className="max-w-md text-sm text-slate-500">
                Click "Add Email Config" to set up SMTP email configuration for
                sending notifications.
              </p>
            </div>
          ) : (
            <div className="-mx-4 overflow-x-auto md:mx-0">
              <table className="min-w-[1100px] w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-3">Display Name</th>
                    <th className="px-4 py-3">Sent Email</th>
                    <th className="px-4 py-3">Hostname</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Port</th>
                    <th className="px-4 py-3">Protocol</th>
                    <th className="px-4 py-3">CC Email</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-700">
                  {emailConfigs.map((config) => (
                    <tr
                      key={config.id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-medium">
                        {config.displayName}
                      </td>
                      <td className="px-4 py-4">{config.sentEmail}</td>
                      <td className="px-4 py-4">{config.hostname}</td>
                      <td className="px-4 py-4">{config.email}</td>
                      <td className="px-4 py-4">{config.port}</td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {config.protocol}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {config.ccEmail ? (
                          <span className="text-slate-700">
                            {config.ccEmail}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {formatDate(config.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenEditEmailConfig(config)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteEmailConfig(config.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  };

  const sectionMeta =
    sections.find((sectionItem) => sectionItem.id === activeSection) ??
    sections[0];

  const renderMainContent = () => {
    const colors = sectionColors[activeSection];

    return (
      <div
        className={`flex h-screen flex-col overflow-hidden ${colors.background}`}
      >
        <header
          className={`shrink-0 rounded-xl border border-white/30 bg-gradient-to-r ${colors.header} p-4 text-white shadow-md`}
        >
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">
            Settings
          </p>
          <h1 className="mt-2 text-xl font-bold">{sectionMeta.label}</h1>
          <p className="mt-1 max-w-2xl text-xs text-white/80">
            {sectionMeta.description}
          </p>
        </header>

        <main className="flex-1 overflow-hidden px-1 pb-6">
          <div className="h-full overflow-y-auto space-y-6 pr-1">
            {activeSection === "hotel" && renderHotelTab()}
            {activeSection === "role" && renderRoleTab()}
            {activeSection === "hotelPrivileges" && renderHotelPrivilegesTab()}
            {activeSection === "hotelRolePrivileges" &&
              renderHotelRolePrivilegesTab()}
            {activeSection === "userPrivileges" && renderUserPrivilegesTab()}
            {activeSection === "user" && renderUserTab()}
            {activeSection === "emailConfig" && renderEmailConfigTab()}
          </div>
        </main>
      </div>
    );
  };

  const roleOptionsForModal = getRoleOptionsForHotel(userForm.hotelId);

  useEffect(() => {
    if (roleOptionsForModal.length === 0) {
      setIsRoleDropdownOpen(false);
    }
  }, [roleOptionsForModal.length]);

  return (
    <>
      {renderMainContent()}

      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title="Add Hotel"
        footer={
          <>
            <Button variant="secondary" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button type="submit" form="create-hotel-form">
              Create Hotel
            </Button>
          </>
        }
      >
        <form id="create-hotel-form" onSubmit={handleCreateHotel}>
          <div className="space-y-4">
            <Input
              label="Hotel Name"
              placeholder="Emerald Oasis Resort"
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              required
            />
            <Input
              label="Address"
              placeholder="42 Beach Road, Southern Province"
              value={createForm.address}
              onChange={(e) =>
                setCreateForm({ ...createForm, address: e.target.value })
              }
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="City"
                value={createForm.city}
                onChange={(e) =>
                  setCreateForm({ ...createForm, city: e.target.value })
                }
                required
              />
              <Input
                label="Country"
                value={createForm.country}
                onChange={(e) =>
                  setCreateForm({ ...createForm, country: e.target.value })
                }
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm({ ...createForm, email: e.target.value })
                }
                required
              />
              <Input
                label="Phone Number"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm({ ...createForm, phone: e.target.value })
                }
                required
              />
            </div>
            <Input
              label="Website"
              placeholder="https://yourhotel.com"
              value={createForm.website}
              onChange={(e) =>
                setCreateForm({ ...createForm, website: e.target.value })
              }
              required
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Logo Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleHotelLogoUpload(e, "create")}
                className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500">
                Upload a square image (PNG, JPG, GIF) up to 2MB.
              </p>
              {createForm.logoUrl && (
                <div className="flex items-center gap-4">
                  <img
                    src={createForm.logoUrl}
                    alt="Preview"
                    className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleRemoveHotelLogo("create")}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal}
        onClose={closeEditModal}
        title="Edit Hotel"
        footer={
          <>
            <Button variant="secondary" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={handleUpdateHotel}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Hotel Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Address"
            value={editForm.address}
            onChange={(e) =>
              setEditForm({ ...editForm, address: e.target.value })
            }
            required
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="City"
              value={editForm.city}
              onChange={(e) =>
                setEditForm({ ...editForm, city: e.target.value })
              }
              required
            />
            <Input
              label="Country"
              value={editForm.country}
              onChange={(e) =>
                setEditForm({ ...editForm, country: e.target.value })
              }
              required
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Email"
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({ ...editForm, email: e.target.value })
              }
              required
            />
            <Input
              label="Phone Number"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
              required
            />
          </div>
          <Input
            label="Website"
            value={editForm.website}
            onChange={(e) =>
              setEditForm({ ...editForm, website: e.target.value })
            }
            required
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Logo Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleHotelLogoUpload(e, "edit")}
              className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500">
              Upload a square image (PNG, JPG, GIF) up to 2MB.
            </p>
            {editForm.logoUrl && (
              <div className="flex items-center gap-4">
                <img
                  src={editForm.logoUrl}
                  alt="Preview"
                  className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveHotelLogo("edit")}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Role Modal */}
      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setEditingRole(null);
          setRoleForm(emptyRoleForm);
        }}
        title={editingRole ? "Edit Role" : "Add Role"}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowRoleModal(false);
                setEditingRole(null);
                setRoleForm(emptyRoleForm);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="role-form">
              {editingRole ? "Save Changes" : "Add Role"}
            </Button>
          </>
        }
      >
        <form
          id="role-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (editingRole) {
              handleUpdateRole();
            } else {
              handleCreateRole(e);
            }
          }}
        >
          <div className="space-y-4">
            <Select
              label="Hotel"
              value={roleForm.hotelId}
              onChange={(e) =>
                setRoleForm({ ...roleForm, hotelId: e.target.value })
              }
              options={[
                { value: "", label: "Select a hotel" },
                ...hotels.map((hotel) => ({
                  value: hotel.id,
                  label: hotel.name,
                })),
              ]}
              required
            />
            <Input
              label="Role Name"
              placeholder="e.g., Manager"
              value={roleForm.name}
              onChange={(e) =>
                setRoleForm({ ...roleForm, name: e.target.value })
              }
              required
            />
            <p className="text-sm text-slate-500">
              Select a hotel and enter a descriptive role name.
            </p>
          </div>
        </form>
      </Modal>

      {/* User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setEditingUser(null);
          setUserForm(emptyUserForm);
        }}
        title={editingUser ? "Edit User" : "Add User"}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowUserModal(false);
                setEditingUser(null);
                setUserForm(emptyUserForm);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" form="user-form">
              {editingUser ? "Save Changes" : "Create User"}
            </Button>
          </>
        }
      >
        <form
          id="user-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (editingUser) {
              handleUpdateUser();
            } else {
              handleCreateUser(e);
            }
          }}
        >
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Name"
                placeholder="John Doe"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="john.doe@example.com"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
                required
              />
            </div>
            <Input
              label="Phone"
              placeholder="+94 77 123 4567"
              value={userForm.phone}
              onChange={(e) =>
                setUserForm({ ...userForm, phone: e.target.value })
              }
              required
            />
            <Select
              label="Hotel"
              value={userForm.hotelId}
              onChange={(e) => {
                setUserForm({
                  ...userForm,
                  hotelId: e.target.value,
                  roleIds: [],
                });
              }}
              options={[
                { value: "", label: "Select a hotel" },
                ...hotels.map((hotel) => ({
                  value: hotel.id,
                  label: hotel.name,
                })),
              ]}
              required
            />
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Roles</p>
              {!userForm.hotelId ? (
                <p className="text-sm text-slate-500">
                  Select a hotel first to view available roles.
                </p>
              ) : roleOptionsForModal.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No roles are assigned to this hotel yet. Assign roles before
                  adding users.
                </p>
              ) : (
                <>
                  <div ref={roleDropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-300 px-4 py-2.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="truncate">
                        {userForm.roleIds.length > 0
                          ? `${userForm.roleIds.length} role${
                              userForm.roleIds.length > 1 ? "s" : ""
                            } selected`
                          : "Select role(s)"}
                      </span>
                      <svg
                        className={`h-4 w-4 text-slate-500 transition-transform ${
                          isRoleDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    {isRoleDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl">
                        <div className="max-h-60 overflow-auto py-2">
                          {roleOptionsForModal.map((option) => {
                            const isSelected = userForm.roleIds.includes(
                              option.value
                            );
                            return (
                              <label
                                key={option.value}
                                className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  checked={isSelected}
                                  onChange={() =>
                                    handleToggleRoleSelection(option.value)
                                  }
                                />
                                <span
                                  className={
                                    isSelected
                                      ? "font-semibold text-slate-900"
                                      : ""
                                  }
                                >
                                  {option.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {userForm.roleIds.length > 0
                      ? "Selected: " +
                        roleOptionsForModal
                          .filter((option) =>
                            userForm.roleIds.includes(option.value)
                          )
                          .map((option) => option.label)
                          .join(", ")
                      : "Choose one or more roles to assign to this user."}
                  </p>
                </>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Email Configuration Modal */}
      <Modal
        isOpen={showEmailConfigModal}
        onClose={closeEmailConfigModal}
        title={
          editingEmailConfig
            ? "Edit Email Configuration"
            : "Add Email Configuration"
        }
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeEmailConfigModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              form={
                editingEmailConfig
                  ? "edit-email-config-form"
                  : "create-email-config-form"
              }
            >
              {editingEmailConfig ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <form
          id={
            editingEmailConfig
              ? "edit-email-config-form"
              : "create-email-config-form"
          }
          onSubmit={
            editingEmailConfig
              ? (e) => {
                  e.preventDefault();
                  handleUpdateEmailConfig();
                }
              : handleCreateEmailConfig
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Display Name"
                placeholder="Hotel Management System"
                value={emailConfigForm.displayName}
                onChange={(e) =>
                  setEmailConfigForm({
                    ...emailConfigForm,
                    displayName: e.target.value,
                  })
                }
                required
              />
              <Input
                label="Sent Email"
                type="email"
                placeholder="noreply@hotel.com"
                value={emailConfigForm.sentEmail}
                onChange={(e) =>
                  setEmailConfigForm({
                    ...emailConfigForm,
                    sentEmail: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Hostname"
                placeholder="smtp.gmail.com"
                value={emailConfigForm.hostname}
                onChange={(e) =>
                  setEmailConfigForm({
                    ...emailConfigForm,
                    hostname: e.target.value,
                  })
                }
                required
              />
              <Input
                label="Port"
                type="number"
                placeholder="587"
                value={emailConfigForm.port}
                onChange={(e) =>
                  setEmailConfigForm({
                    ...emailConfigForm,
                    port: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Protocol"
                value={emailConfigForm.protocol}
                onChange={(e) =>
                  setEmailConfigForm({
                    ...emailConfigForm,
                    protocol: e.target.value,
                  })
                }
                options={[
                  { value: "SMTP", label: "SMTP" },
                  { value: "SMTPS", label: "SMTPS" },
                  { value: "TLS", label: "TLS" },
                ]}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="username@example.com"
                value={emailConfigForm.email}
                onChange={(e) =>
                  setEmailConfigForm({
                    ...emailConfigForm,
                    email: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showEmailPassword ? "text" : "password"}
                placeholder="Enter password"
                value={emailConfigForm.password}
                onChange={(e) =>
                  setEmailConfigForm({
                    ...emailConfigForm,
                    password: e.target.value,
                  })
                }
                required
              />
              <button
                type="button"
                onClick={() => setShowEmailPassword(!showEmailPassword)}
                className="absolute right-3 top-9 text-slate-500 hover:text-slate-700"
              >
                {showEmailPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={ccEnabled}
                    onChange={(e) => {
                      setCcEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setEmailConfigForm({
                          ...emailConfigForm,
                          ccEmail: "",
                        });
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Enable CC (Carbon Copy) - Optional
                  </span>
                </label>

                {ccEnabled && (
                  <Input
                    label="CC Email Address"
                    type="email"
                    placeholder="cc@hotel.com"
                    value={emailConfigForm.ccEmail}
                    onChange={(e) =>
                      setEmailConfigForm({
                        ...emailConfigForm,
                        ccEmail: e.target.value,
                      })
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
};
