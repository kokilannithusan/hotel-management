import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Trash2 } from "lucide-react";

type CleaningCategory = "washroom" | "bedroom";

interface CleaningTaskState {
  washroom: string[];
  bedroom: string[];
}

const defaultTasks: CleaningTaskState = {
  washroom: [
    "Cleaning mirror",
    "Scrub toilet",
    "Clean sink",
    "Clean shower/bathtub",
    "Replace towels",
    "Sanitize surface",
  ],
  bedroom: [
    "Change bed sheets",
    "Vacuum floor",
    "Pick up trash",
    "Restock amenities",
    "Check mini bar",
    "Check electricals",
    "Replace water bottles",
    "Final inspection",
  ],
};

const selectOptions = [
  { value: "washroom", label: "Washroom Activities" },
  { value: "bedroom", label: "Bedroom Activities" },
];

export const CleaningTaskList: React.FC = () => {
  const [tasks, setTasks] = useState<CleaningTaskState>(() => {
    const saved = localStorage.getItem("cleaning_task_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          washroom: Array.isArray(parsed.washroom)
            ? parsed.washroom
            : defaultTasks.washroom,
          bedroom: Array.isArray(parsed.bedroom)
            ? parsed.bedroom
            : defaultTasks.bedroom,
        };
      } catch {
        return defaultTasks;
      }
    }
    return defaultTasks;
  });

  const [showModal, setShowModal] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskCategory, setNewTaskCategory] =
    useState<CleaningCategory>("washroom");

  useEffect(() => {
    localStorage.setItem("cleaning_task_list", JSON.stringify(tasks));
  }, [tasks]);

  const isAddDisabled = useMemo(
    () => newTaskLabel.trim().length === 0,
    [newTaskLabel]
  );

  const handleAddTask = () => {
    if (isAddDisabled) return;
    setTasks((prev) => ({
      ...prev,
      [newTaskCategory]: [...prev[newTaskCategory], newTaskLabel.trim()],
    }));
    setNewTaskLabel("");
    setNewTaskCategory("washroom");
    setShowModal(false);
  };

  const handleDeleteTask = (category: CleaningCategory, index: number) => {
    setTasks((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, idx) => idx !== index),
    }));
  };

  const renderTaskList = (category: CleaningCategory, title: string) => (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
          {category === "washroom" ? "Washroom" : "Bedroom"}
        </p>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">
          Keep this list updated with the latest SOP activities.
        </p>
      </div>
      <ul className="space-y-3">
        {tasks[category].map((task, idx) => (
          <li
            key={`${category}-${idx}-${task}`}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-700"
          >
            <span className="flex-1">{task}</span>
            <button
              onClick={() => handleDeleteTask(category, idx)}
              className="ml-3 rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 transition-colors"
              title="Delete task"
              aria-label={`Delete ${task}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 px-4 sm:px-6 lg:px-10 py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
              Manager
            </p>
            <h1 className="text-3xl font-bold text-slate-900">
              Cleaning Task List
            </h1>
            <p className="text-sm text-slate-500">
              Maintain standardized activities for every cleaning session.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto"
          >
            Add Activities
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {renderTaskList("washroom", "Washroom Activities")}
          {renderTaskList("bedroom", "Bedroom Activities")}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Activity"
      >
        <div className="space-y-4">
          <Select
            value={newTaskCategory}
            onChange={(e) =>
              setNewTaskCategory(e.target.value as CleaningCategory)
            }
            options={selectOptions}
            className="w-full"
          />
          <Input
            placeholder="Activity name"
            value={newTaskLabel}
            onChange={(e) => setNewTaskLabel(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTask} disabled={isAddDisabled}>
              Save Activity
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
