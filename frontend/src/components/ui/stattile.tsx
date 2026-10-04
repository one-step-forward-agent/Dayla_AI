import * as React from "react";
import { Card, CardContent } from "./card";

interface StatTileProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
}

export const StatTile: React.FC<StatTileProps> = ({ label, value, icon }) => (
  <Card>
    <CardContent className="flex items-center justify-between p-6">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-3xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      {icon && <div className="text-blue-600 dark:text-blue-400" aria-hidden="true">{icon}</div>}
    </CardContent>
  </Card>
);
