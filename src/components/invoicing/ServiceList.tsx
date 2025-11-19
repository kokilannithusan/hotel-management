import React from "react";
import { Card } from "../ui/Card";

interface Service {
  id: string;
  name: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

interface AdditionalCharge {
  id: string;
  name: string;
  amount: number;
}

interface ServiceListProps {
  services?: Service[];
  additionalCharges?: AdditionalCharge[];
}

export const ServiceList: React.FC<ServiceListProps> = ({
  services = [],
  additionalCharges = [],
}) => {
  if (services.length === 0 && additionalCharges.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Services & Additional Charges
        </h2>

        {services.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Services
            </h3>
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{service.name}</p>
                    {service.quantity && service.unitPrice && (
                      <p className="text-sm text-gray-500">
                        {service.quantity} x LKR{" "}
                        {service.unitPrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">
                    LKR {service.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {additionalCharges.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Additional Charges
            </h3>
            <div className="space-y-3">
              {additionalCharges.map((charge) => (
                <div
                  key={charge.id}
                  className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                >
                  <p className="font-medium text-gray-900">{charge.name}</p>
                  <span className="font-semibold text-gray-900">
                    LKR {charge.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
