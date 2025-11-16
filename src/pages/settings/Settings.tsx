import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Table } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { Select } from "../../components/ui/Select";
import { generateId } from "../../utils/formatters";
import { User } from "../../types/entities";
import { clearAllStorage } from "../../utils/storage";

export const Settings: React.FC = () => {
  const { state, dispatch, initializeData } = useHotel();
  const [activeTab, setActiveTab] = useState<"hotel" | "users" | "data">(
    "hotel"
  );
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "Receptionist",
    isActive: true,
  });

  const [hotelFormData, setHotelFormData] = useState(
    state.settings || {
      id: generateId(),
      name: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      website: "",
      currency: "USD",
      timezone: "UTC",
    }
  );

  const handleSaveHotel = () => {
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: hotelFormData,
    });
    alert("Hotel settings saved!");
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setShowUserModal(true);
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: "",
      email: "",
      role: "Receptionist",
      isActive: true,
    });
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      dispatch({
        type: "UPDATE_USER",
        payload: { ...editingUser, ...userFormData },
      });
    } else {
      dispatch({
        type: "ADD_USER",
        payload: {
          id: generateId(),
          ...userFormData,
        },
      });
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      dispatch({ type: "DELETE_USER", payload: user.id });
    }
  };

  const handleExportData = () => {
    const data = {
      customers: state.customers,
      rooms: state.rooms,
      reservations: state.reservations,
      bills: state.bills,
      receipts: state.receipts,
      // ... add other data as needed
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hotel-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        JSON.parse(event.target?.result as string);
        // In a real app, you would validate and import the data
        alert("Data import functionality would be implemented here");
      } catch (error) {
        alert("Error importing data");
      }
    };
    reader.readAsText(file);
  };

  const userColumns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    {
      key: "isActive",
      header: "Status",
      render: (u: User) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            u.isActive
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {u.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (u: User) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditUser(u)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDeleteUser(u)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-slate-600 mt-1 font-medium">
          Configure hotel settings and preferences
        </p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {(["hotel", "users", "data"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "hotel" && (
        <Card title="Hotel Information">
          <div className="space-y-4">
            <Input
              label="Hotel Name"
              value={hotelFormData.name}
              onChange={(e) =>
                setHotelFormData({ ...hotelFormData, name: e.target.value })
              }
            />
            <Input
              label="Address"
              value={hotelFormData.address}
              onChange={(e) =>
                setHotelFormData({ ...hotelFormData, address: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={hotelFormData.city}
                onChange={(e) =>
                  setHotelFormData({ ...hotelFormData, city: e.target.value })
                }
              />
              <Input
                label="Country"
                value={hotelFormData.country}
                onChange={(e) =>
                  setHotelFormData({
                    ...hotelFormData,
                    country: e.target.value,
                  })
                }
              />
            </div>
            <Input
              label="Phone"
              value={hotelFormData.phone}
              onChange={(e) =>
                setHotelFormData({ ...hotelFormData, phone: e.target.value })
              }
            />
            <Input
              label="Email"
              type="email"
              value={hotelFormData.email}
              onChange={(e) =>
                setHotelFormData({ ...hotelFormData, email: e.target.value })
              }
            />
            <Input
              label="Website"
              value={hotelFormData.website || ""}
              onChange={(e) =>
                setHotelFormData({ ...hotelFormData, website: e.target.value })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Currency"
                value={hotelFormData.currency}
                onChange={(e) =>
                  setHotelFormData({
                    ...hotelFormData,
                    currency: e.target.value,
                  })
                }
              />
              <Input
                label="Timezone"
                value={hotelFormData.timezone}
                onChange={(e) =>
                  setHotelFormData({
                    ...hotelFormData,
                    timezone: e.target.value,
                  })
                }
              />
            </div>
            <Button onClick={handleSaveHotel}>Save Hotel Settings</Button>
          </div>
        </Card>
      )}

      {activeTab === "users" && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">User Management</h2>
            <Button onClick={handleAddUser}>Add User</Button>
          </div>
          <Card>
            <Table columns={userColumns} data={state.users} />
          </Card>

          <Modal
            isOpen={showUserModal}
            onClose={() => setShowUserModal(false)}
            title={editingUser ? "Edit User" : "Add User"}
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => setShowUserModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveUser}>Save</Button>
              </>
            }
          >
            <div className="space-y-4">
              <Input
                label="Name"
                value={userFormData.name}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, name: e.target.value })
                }
                required
              />
              <Input
                label="Email"
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, email: e.target.value })
                }
                required
              />
              <Select
                label="Role"
                value={userFormData.role}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, role: e.target.value })
                }
                options={[
                  { value: "Admin", label: "Admin" },
                  { value: "Manager", label: "Manager" },
                  { value: "Receptionist", label: "Receptionist" },
                ]}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={userFormData.isActive}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      isActive: e.target.checked,
                    })
                  }
                  className="mr-2"
                />
                <label>Active</label>
              </div>
            </div>
          </Modal>
        </>
      )}

      {activeTab === "data" && (
        <Card title="Data Management">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Export Data</h3>
              <Button onClick={handleExportData}>Export to JSON</Button>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Import Data</h3>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Reset to Sample Data</h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Are you sure you want to reset all data to sample data? This will replace all current data."
                      )
                    ) {
                      clearAllStorage();
                      initializeData();
                      alert("Data has been reset to sample data!");
                    }
                  }}
                >
                  Reset to Sample Data
                </Button>
                <p className="text-sm text-slate-600">
                  This will reload all sample data from the mock data file.
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-600">Danger Zone</h3>
              <Button
                variant="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to clear all data? This cannot be undone!"
                    )
                  ) {
                    clearAllStorage();
                    window.location.reload();
                  }
                }}
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
