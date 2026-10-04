import * as React from "react";
import { cn } from "@/utils/cn";

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="w-full overflow-x-auto">
    <table className={cn("w-full text-sm text-left", className)} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = (props) => (
  <thead className="border-b border-gray-200 dark:border-gray-700" {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = (props) => (
  <tbody className="divide-y divide-gray-100 dark:divide-gray-800" {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn("hover:bg-gray-50 dark:hover:bg-gray-700/50", className)} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th scope="col" className={cn("px-4 py-3 font-medium text-gray-500 dark:text-gray-400", className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn("px-4 py-3 text-gray-900 dark:text-gray-100", className)} {...props} />
);
