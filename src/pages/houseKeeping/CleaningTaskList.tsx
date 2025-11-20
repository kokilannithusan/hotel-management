import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Trash2, ArrowLeft } from "lucide-react";
import { mockRoomTypes } from "../../data/mockData";

type CleaningCategory = string;

interface CategoryData {
  tasks: string[];
  roomTypes: string[]; // assigned room type names (e.g., Deluxe, Suite)
}

interface CleaningTaskState {
  [key: string]: CategoryData;
}

const defaultTasks: CleaningTaskState = {
  washroom: {
    tasks: [
      "Cleaning mirror",
      "Scrub toilet",
      "Clean sink",
      "Clean shower/bathtub",
      "Replace towels",
      "Sanitize surface",
    ],
    roomTypes: [],
  },
  bedroom: {
    tasks: [
      "Change bed sheets",
      "Vacuum floor",
      "Pick up trash",
      "Restock amenities",
      "Check mini bar",
      "Check electricals",
      "Replace water bottles",
      "Final inspection",
    ],
    roomTypes: [],
  },
};

const getSelectOptions = (categories: string[]) => {
  return categories.map((cat) => ({
    value: cat,
    label:
      cat.charAt(0).toUpperCase() +
      cat.slice(1).replace(/-/g, " ") +
      " Activities",
  }));
};

export const CleaningTaskList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<CleaningTaskState>(() => {
    const saved = localStorage.getItem("cleaning_task_list");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If parsed is old format (category -> string[]), convert
        const converted: CleaningTaskState = {};
        Object.entries(parsed).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            converted[k] = { tasks: v as string[], roomTypes: [] };
          } else if (v && typeof v === "object") {
            converted[k] = {
              tasks: (v as any).tasks || [],
              roomTypes: (v as any).roomTypes || [],
            };
          }
        });
        // Ensure default categories exist
        return {
          ...defaultTasks,
          ...converted,
        };
      } catch {
        return defaultTasks;
      }
    }
    return defaultTasks;
  });

  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskCategory, setNewTaskCategory] =
    useState<CleaningCategory>("washroom");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [multipleTasksInput, setMultipleTasksInput] = useState("");

  const categories = useMemo(() => Object.keys(tasks), [tasks]);
  const selectOptions = useMemo(
    () => getSelectOptions(categories),
    [categories]
  );

  useEffect(() => {
    localStorage.setItem("cleaning_task_list", JSON.stringify(tasks));
  }, [tasks]);

  const isAddActivityDisabled = useMemo(
    () => newTaskLabel.trim().length === 0,
    [newTaskLabel]
  );

  const isAddCategoryDisabled = useMemo(
    () =>
      newCategoryName.trim().length === 0 ||
      categories.includes(newCategoryName.toLowerCase()),
    [newCategoryName, categories]
  );

  const handleAddTask = () => {
    if (isAddActivityDisabled) return;
    setTasks((prev) => ({
      ...prev,
      [newTaskCategory]: {
        tasks: [
          ...((prev[newTaskCategory] && prev[newTaskCategory].tasks) || []),
          newTaskLabel.trim(),
        ],
        roomTypes:
          (prev[newTaskCategory] && prev[newTaskCategory].roomTypes) || [],
      },
    }));
    setNewTaskLabel("");
    setNewTaskCategory("washroom");
    setShowAddActivityModal(false);
  };

  const handleAddMultipleTasks = () => {
    const lines = multipleTasksInput.split("\n").filter((line) => line.trim());
    if (lines.length === 0) return;
    setTasks((prev) => ({
      ...prev,
      [newTaskCategory]: {
        tasks: [
          ...((prev[newTaskCategory] && prev[newTaskCategory].tasks) || []),
          ...lines.map((line) => line.trim()),
        ],
        roomTypes:
          (prev[newTaskCategory] && prev[newTaskCategory].roomTypes) || [],
      },
    }));
    setMultipleTasksInput("");
    setNewTaskCategory("washroom");
    setShowAddActivityModal(false);
  };

  const [newCategoryRoomTypes, setNewCategoryRoomTypes] = useState<string[]>(
    []
  );

  const handleToggleNewCategoryRoomType = (typeName: string) => {
    setNewCategoryRoomTypes((prev) =>
      prev.includes(typeName)
        ? prev.filter((t) => t !== typeName)
        : [...prev, typeName]
    );
  };

  const handleAddCategory = () => {
    if (isAddCategoryDisabled) return;
    const categoryKey = newCategoryName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    setTasks((prev) => ({
      ...prev,
      [categoryKey]: { tasks: [], roomTypes: newCategoryRoomTypes },
    }));
    setNewCategoryName("");
    setNewCategoryRoomTypes([]);
    setShowAddCategoryModal(false);
  };

  const handleDeleteTask = (category: CleaningCategory, index: number) => {
    setTasks((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        tasks: prev[category].tasks.filter((_, idx) => idx !== index),
      },
    }));
  };

  const handleDeleteCategory = (category: CleaningCategory) => {
    // Prevent deletion of default categories
    if (category === "washroom" || category === "bedroom") {
      alert("Cannot delete default categories");
      return;
    }
    setTasks((prev) => {
      const newTasks = { ...prev };
      delete newTasks[category];
      return newTasks;
    });
  };

  const renderTaskList = (category: CleaningCategory, title: string) => (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blue-400">
            {category.replace(/-/g, " ")}
          </p>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            Keep this list updated with the latest SOP activities.
          </p>
        </div>
        {category !== "washroom" && category !== "bedroom" && (
          <button
            onClick={() => handleDeleteCategory(category)}
            className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition-colors"
            title="Delete category"
            aria-label={`Delete ${category} category`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <ul className="space-y-3">
        {(tasks[category] && tasks[category].tasks
          ? tasks[category].tasks
          : []
        ).map((task, idx) => (
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
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg flex flex-col gap-4">
          <button
            onClick={() => navigate("/housekeeping/manager")}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors w-fit"
            aria-label="Go back to housekeeping manager"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">
              Back to Housekeeping Manager
            </span>
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => setShowAddCategoryModal(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Add Category
              </Button>
              <Button
                size="lg"
                onClick={() => setShowAddActivityModal(true)}
                className="w-full sm:w-auto"
              >
                Add Activities
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {categories.map((category) => {
            const displayName = category
              .split("-")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            return renderTaskList(category, `${displayName} Activities`);
          })}
        </div>
      </div>

      <Modal
        isOpen={showAddActivityModal}
        onClose={() => {
          setShowAddActivityModal(false);
          setNewTaskLabel("");
          setMultipleTasksInput("");
        }}
        title="Add Activities"
      >
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-slate-900 mb-3 block">
              Category
            </label>
            <Select
              value={newTaskCategory}
              onChange={(e) =>
                setNewTaskCategory(e.target.value as CleaningCategory)
              }
              options={selectOptions}
              className="w-full"
            />
          </div>

          {/* Single Activity Tab */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">
              Add Single Activity
            </h4>
            <Input
              placeholder="Activity name"
              value={newTaskLabel}
              onChange={(e) => setNewTaskLabel(e.target.value)}
            />
            <Button
              onClick={handleAddTask}
              disabled={isAddActivityDisabled}
              className="w-full"
            >
              Add Activity
            </Button>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500 mb-3">
              Or add multiple activities below
            </p>
          </div>

          {/* Multiple Activities Tab */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700">
              Add Multiple Activities
            </h4>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">
                Enter activities (one per line)
              </label>
              <textarea
                placeholder="Activity 1&#10;Activity 2&#10;Activity 3&#10;Activity 4"
                value={multipleTasksInput}
                onChange={(e) => setMultipleTasksInput(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-2">
                {
                  multipleTasksInput.split("\n").filter((line) => line.trim())
                    .length
                }{" "}
                activities
              </p>
            </div>
            <Button
              onClick={handleAddMultipleTasks}
              disabled={
                multipleTasksInput.split("\n").filter((line) => line.trim())
                  .length === 0
              }
              variant="secondary"
              className="w-full"
            >
              Add{" "}
              {
                multipleTasksInput.split("\n").filter((line) => line.trim())
                  .length
              }{" "}
              Activities
            </Button>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button
              variant="secondary"
              onClick={() => {
                setShowAddActivityModal(false);
                setNewTaskLabel("");
                setMultipleTasksInput("");
              }}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddCategoryModal}
        onClose={() => setShowAddCategoryModal(false)}
        title="Add Activity Category"
      >
        <div className="space-y-4">
          <Input
            placeholder="Category name (e.g., Kitchen, Laundry)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <div className="mt-3">
            <p className="text-sm font-medium text-slate-700 mb-2">
              Assign to room types
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
              {mockRoomTypes.map((rt) => (
                <label key={rt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newCategoryRoomTypes.includes(rt.name)}
                    onChange={() => handleToggleNewCategoryRoomType(rt.name)}
                    className="w-4 h-4"
                  />
                  <span>{rt.name}</span>
                </label>
              ))}
            </div>
          </div>
          {categories.includes(newCategoryName.toLowerCase()) && (
            <p className="text-sm text-rose-500">Category already exists</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowAddCategoryModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={isAddCategoryDisabled}
            >
              Create Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
