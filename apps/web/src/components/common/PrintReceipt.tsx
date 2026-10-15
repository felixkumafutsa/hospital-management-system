import React from 'react';
import { Box, Typography, Divider } from '@mui/material';

interface ReceiptProps {
  invoice: any; // Replace 'any' with a proper Invoice type
}

const PrintReceipt: React.FC<ReceiptProps> = ({ invoice }) => {
  return (
    <Box
      id="receipt-to-print"
      sx={{
        display: 'none',
        '@media print': {
          display: 'block',
          width: '80mm',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '10px',
        },
      }}
    >
      <Typography variant="h6" align="center">Better Life Clinic</Typography>
      <Typography variant="body2" align="center">Your Health, Our Priority</Typography>
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2">Invoice #: {invoice.invoiceNumber}</Typography>
      <Typography variant="body2">Date: {new Date(invoice.createdAt).toLocaleString()}</Typography>
      <Typography variant="body2">Patient: {invoice.patient.firstName} {invoice.patient.lastName}</Typography>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2">Item</Typography>
        <Typography variant="body2">Amount</Typography>
      </Box>
      {invoice.items.map((item: any) => (
        <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">{item.name}</Typography>
          <Typography variant="body2">{item.price.toFixed(2)}</Typography>
        </Box>
      ))}
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Total</Typography>
        <Typography variant="h6">{invoice.total.toFixed(2)}</Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Typography variant="body2" align="center">Thank you for your visit!</Typography>
    </Box>
  );
};

export default PrintReceipt;