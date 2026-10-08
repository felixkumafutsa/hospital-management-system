import { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useDutyRosterStore } from '../../stores/dutyRosterStore';
import { enUS } from 'date-fns/locale/en-US';
import AddShiftDialog from '../../components/duty-roster/AddShiftDialog';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DutyRosterPage = () => {
  const { dutyRosters, fetchDutyRosters } = useDutyRosterStore();
  const [isAddShiftDialogOpen, setIsAddShiftDialogOpen] = useState(false);

  useEffect(() => {
    fetchDutyRosters();
  }, [fetchDutyRosters]);

  const events = dutyRosters.map(roster => ({
    title: `Staff: ${roster.staffId}`,
    start: new Date(roster.startTime),
    end: new Date(roster.endTime),
  }));

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>Duty Roster</Typography>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setIsAddShiftDialogOpen(true)}>Add Shift</Button>
      <Box sx={{ height: '70vh' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
        />
      </Box>
      <AddShiftDialog
        open={isAddShiftDialogOpen}
        onClose={() => setIsAddShiftDialogOpen(false)}
      />
    </Box>
  );
};

export default DutyRosterPage;