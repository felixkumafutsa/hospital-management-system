import { Plus } from "lucide-react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from "@mui/material";
import { DataTable } from "../data-table";
import { createColumns } from "./columns";
import { useDutyRosterStore } from "../../stores/dutyRosterStore";
import { useEffect, useState } from "react";
import AddShiftDialog from "./AddShiftDialog";
import { getUsers, User } from "../../services/userService";

const DutyRoster = () => {
  const { dutyRosters, fetchDutyRosters } = useDutyRosterStore();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchDutyRosters();
    const loadUsers = async () => {
      try {
        const fetchedUsers = await getUsers();
        setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      }
    };
    loadUsers();
  }, [fetchDutyRosters]);

  const columns = createColumns(users);

  return (
    <Card>
      <CardHeader>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">Duty Roster</Typography>
          <Button
            variant="contained"
            startIcon={<Plus />}
            onClick={() => setOpen(true)}
          >
            Add Shift
          </Button>
        </Box>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={dutyRosters} />
      </CardContent>
      <AddShiftDialog open={open} onClose={() => setOpen(false)} />
    </Card>
  );
};

export default DutyRoster;