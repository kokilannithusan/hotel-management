import React from "react";
import { Card } from "../ui/Card";

interface InvoiceSummaryCardProps {
  chargeBreakdown: {
    roomCharges?: number;
    eventCharges?: number;
    mealPlanTotal?: number;
    serviceTotal: number;
    extraCharges: number;
    subTotal: number;
    taxRate: number;
    taxAmount: number;
    discount: number;
    grandTotal: number;
  };
}

export const InvoiceSummaryCard: React.FC<InvoiceSummaryCardProps> = ({
  chargeBreakdown,
}) => {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Charge Summary</h2>
        <div className="space-y-3">
          {chargeBreakdown.roomCharges !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Room Charges</span>
              <span className="font-semibold text-gray-900">
                LKR {chargeBreakdown.roomCharges.toLocaleString()}
              </span>
            </div>
          )}

          {chargeBreakdown.eventCharges !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Event Charges</span>
              <span className="font-semibold text-gray-900">
                LKR {chargeBreakdown.eventCharges.toLocaleString()}
              </span>
            </div>
          )}

          {chargeBreakdown.mealPlanTotal !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Meal Plan Total</span>
              <span className="font-semibold text-gray-900">
                LKR {chargeBreakdown.mealPlanTotal.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-600">Services</span>
            <span className="font-semibold text-gray-900">
              LKR {chargeBreakdown.serviceTotal.toLocaleString()}
            </span>
          </div>

          {chargeBreakdown.extraCharges > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Additional Charges</span>
              <span className="font-semibold text-gray-900">
                LKR {chargeBreakdown.extraCharges.toLocaleString()}
              </span>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">
                LKR {chargeBreakdown.subTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">
              Tax ({chargeBreakdown.taxRate}%)
            </span>
            <span className="font-semibold text-gray-900">
              LKR {chargeBreakdown.taxAmount.toLocaleString()}
            </span>
          </div>

          {chargeBreakdown.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="font-semibold">
                - LKR {chargeBreakdown.discount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="border-t pt-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">
                Grand Total
              </span>
              <span className="text-2xl font-bold text-blue-600">
                LKR {chargeBreakdown.grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
