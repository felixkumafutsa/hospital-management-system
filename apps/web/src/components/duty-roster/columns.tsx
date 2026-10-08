import { ColumnDef } from "@tanstack/react-table";
import { DutyRoster } from "../../services/dutyRosterService";
import { User } from "../../services/userService";

export interface DutyRosterWithStaff extends DutyRoster {
  staff?: User;
}

export const createColumns = (users: User[]): ColumnDef<DutyRosterWithStaff>[] => [
  {
    accessorKey: "staffId",
    header: "Staff Name",
    cell: ({ row }) => {
      const staff = users.find(u => u.id === row.original.staffId);
      return staff ? `${staff.firstName} ${staff.lastName}` : row.original.staffId;
    },
  },
  {
    accessorKey: "startTime",
    header: "Start Time",
  },
  {
    accessorKey: "endTime",
    header: "End Time",
  },
];