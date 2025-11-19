import React from "react";
import { UtensilsCrossed } from "lucide-react";

interface MealPlanCardProps {
  mealPlanType: string;
  pricePerDay: number;
  totalPrice: number;
  nights: number;
}

export const MealPlanCard: React.FC<MealPlanCardProps> = ({
  mealPlanType,
  pricePerDay,
  totalPrice,
  nights,
}) => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <UtensilsCrossed className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-1">
            {mealPlanType}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            LKR {pricePerDay.toLocaleString()} per day × {nights} night
            {nights !== 1 ? "s" : ""}
          </p>
          <div className="flex justify-between items-center pt-2 border-t border-green-200">
            <span className="text-sm font-medium text-gray-700">
              Meal Plan Total
            </span>
            <span className="text-lg font-bold text-green-700">
              LKR {totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
