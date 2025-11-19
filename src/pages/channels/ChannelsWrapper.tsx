import React from "react";
import { Channels } from "./Channels";
import { useReservationTypes } from "../../context/ReservationTypeContext";

export const ChannelsWrapper: React.FC = () => {
  const { customTypes } = useReservationTypes();

  return <Channels customTypes={customTypes} />;
};
