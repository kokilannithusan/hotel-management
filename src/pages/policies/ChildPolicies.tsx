import React, { useMemo, useState } from "react";
import { useHotel } from "../../context/HotelContext";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Policy } from "../../types/entities";
import { Edit, Trash2, Plus, X, Check } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { generateId } from "../../utils/formatters";

export const ChildPolicies: React.FC = () => {
  const { state, dispatch } = useHotel();
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [formData, setFormData] = useState({ title: "", description: "" });

  const policies = useMemo(
    () =>
      state.policies.filter(
        (p) =>
          p.category.toLowerCase().includes("child") &&
          (p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase()))
      ),
    [state.policies, search]
  );

  const totalPolicies = policies.length;

  const columns = [
    { key: "title", header: "Policy Name" },
    {
      key: "description",
      header: "Description",
      render: (policy: Policy) => (
        <div className="max-w-xl whitespace-normal">{policy.description}</div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (policy: Policy) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
            policy.isActive
              ? "bg-green-100 text-green-800"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {policy.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (policy: Policy) => (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            aria-label="Edit policy"
            title="Edit policy"
            onClick={() => {
              setEditingPolicy(policy);
              setFormData({
                title: policy.title,
                description: policy.description,
              });
              setShowModal(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            aria-label="Delete policy"
            title="Delete policy"
            onClick={() => {
              if (
                window.confirm(
                  `Are you sure you want to delete ${policy.title}?`
                )
              ) {
                dispatch({ type: "DELETE_POLICY", payload: policy.id });
              }
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Child Policies</h1>
          <p className="text-slate-600">
            Manage child accommodation and pricing policies.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPolicy(null);
            setFormData({ title: "", description: "" });
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          New Policy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-500">Total Policies</p>
            <p className="text-3xl font-bold text-blue-600">{totalPolicies}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <p className="text-sm text-slate-500">Category</p>
            <p className="text-3xl font-bold text-purple-600">Child</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold">All Child Policies</h3>
          <Input
            label=""
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table columns={columns} data={policies} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPolicy ? "Edit Child Policy" : "Add Child Policy"}
        footer={
          <>
            <Button
              aria-label="Cancel"
              title="Cancel"
              variant="secondary"
              onClick={() => setShowModal(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              aria-label="Save"
              title="Save"
              onClick={() => {
                const title = formData.title.trim();
                const description = formData.description.trim();
                if (!title || !description) {
                  alert("Please fill in title and description.");
                  return;
                }
                if (editingPolicy) {
                  dispatch({
                    type: "UPDATE_POLICY",
                    payload: {
                      ...editingPolicy,
                      title,
                      description,
                      category: "Child Policy",
                      isActive: true,
                    },
                  });
                } else {
                  dispatch({
                    type: "ADD_POLICY",
                    payload: {
                      id: generateId(),
                      title,
                      description,
                      category: "Child Policy",
                      isActive: true,
                    },
                  });
                }
                setShowModal(false);
                setEditingPolicy(null);
              }}
            >
              <Check className="w-4 h-4" />
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Policy Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="e.g., 0-2 years free"
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Explain charges or allowances for this age group"
              required
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
