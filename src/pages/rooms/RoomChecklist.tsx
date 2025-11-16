import React, { useMemo, useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/formatters';
import { HousekeepingTask } from '../../types/entities';

export const RoomChecklist: React.FC = () => {
	const { state, dispatch } = useHotel();

	const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
		return state.rooms[0]?.id || '';
	});
	const [newTaskText, setNewTaskText] = useState<string>('');

	const roomsOptions = useMemo(
		() =>
			state.rooms.map((r) => ({
				value: r.id,
				label: `Room ${r.roomNumber}`,
			})),
		[state.rooms]
	);

	const housekeepingForRoom = useMemo(() => {
		return state.housekeeping.find((h) => h.roomId === selectedRoomId);
	}, [state.housekeeping, selectedRoomId]);

	const handleAddTask = () => {
		if (!housekeepingForRoom || !newTaskText.trim()) return;
		const newTask: HousekeepingTask = {
			id: generateId(),
			roomId: housekeepingForRoom.roomId,
			task: newTaskText.trim(),
			completed: false,
		};
		const updated = { ...housekeepingForRoom, tasks: [...housekeepingForRoom.tasks, newTask] };
		dispatch({ type: 'UPDATE_HOUSEKEEPING', payload: updated });
		setNewTaskText('');
	};

	const handleToggleTask = (taskId: string) => {
		if (!housekeepingForRoom) return;
		const updatedTasks = housekeepingForRoom.tasks.map((t) =>
			t.id === taskId ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : undefined } : t
		);
		const updated = { ...housekeepingForRoom, tasks: updatedTasks };
		dispatch({ type: 'UPDATE_HOUSEKEEPING', payload: updated });
	};

	const handleDeleteTask = (taskId: string) => {
		if (!housekeepingForRoom) return;
		const updated = { ...housekeepingForRoom, tasks: housekeepingForRoom.tasks.filter((t) => t.id !== taskId) };
		dispatch({ type: 'UPDATE_HOUSEKEEPING', payload: updated });
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Select
					value={selectedRoomId}
					onChange={(e) => setSelectedRoomId(e.target.value)}
					options={roomsOptions}
					className="w-64"
				/>
			</div>

			<Card title="Room Checklist">
				{!housekeepingForRoom ? (
					<div className="text-sm text-slate-500">No checklist found for this room.</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center gap-2">
							<Input
								placeholder="Add a new task..."
								value={newTaskText}
								onChange={(e) => setNewTaskText(e.target.value)}
								className="flex-1"
							/>
							<Button aria-label="Add task" title="Add task" onClick={handleAddTask}>
								<Plus className="w-4 h-4" />
							</Button>
						</div>

						<div className="space-y-2">
							{housekeepingForRoom.tasks.length === 0 ? (
								<p className="text-sm text-slate-500">No tasks yet.</p>
							) : (
								housekeepingForRoom.tasks.map((task) => (
									<div key={task.id} className="flex items-center justify-between p-2 rounded-md border border-dark-700">
										<label className="flex items-center">
											<input
												type="checkbox"
												checked={task.completed}
												onChange={() => handleToggleTask(task.id)}
												className="mr-3"
											/>
											<span className={task.completed ? 'line-through text-slate-500' : ''}>{task.task}</span>
										</label>
										<Button aria-label="Delete task" title="Delete task" variant="danger" onClick={() => handleDeleteTask(task.id)}>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								))
							)}
						</div>
					</div>
				)}
			</Card>
		</div>
	);
};


