import React from "react";
import { CreateEventForm } from "./CreateEventForm";

export const CreateEvent: React.FC = () => {
  return (
    <div className="p-6">
      <CreateEventForm showCRUD={true} mode="list" />
    </div>
  );
};
