import React, { useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { generateId } from "../../utils/formatters";
import type { ChannelStatus } from "../../types/entities";

export const ReservationType: React.FC = () => {
  const { dispatch } = useHotel();
  const [formData, setFormData] = useState<{
    name: string;
    type: string;
    apiKey: string;
    contactPerson: string;
    status: ChannelStatus;
  }>({
    name: "",
    type: "OTA",
    apiKey: "",
    contactPerson: "",
    status: "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({
      type: "ADD_CHANNEL",
      payload: {
        id: generateId(),
        ...formData,
      },
    });
    alert("Channel registered successfully!");
    setFormData({
      name: "",
      type: "OTA",
      apiKey: "",
      contactPerson: "",
      status: "active",
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          Register Channel
        </h1>
        <p className="text-slate-600 mt-1 font-medium">
          Register new booking channels to the system
        </p>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Channel Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: "Direct", label: "Direct" },
              { value: "OTA", label: "OTA" },
              { value: "Agent", label: "Agent" },
              { value: "Walk-in", label: "Walk-in" },
            ]}
          />
          <Input
            label="API Key (Mock)"
            value={formData.apiKey}
            onChange={(e) =>
              setFormData({ ...formData, apiKey: e.target.value })
            }
            placeholder="Enter mock API key"
          />
          <Input
            label="Contact Person"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({
                ...formData,
                status: e.target.value as ChannelStatus,
              })
            }
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
          />
          <Button type="submit">Register Channel</Button>
        </form>
      </Card>
    </div>
  );
};
