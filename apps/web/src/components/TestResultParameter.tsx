import React from "react";
import { Grid, TextField, IconButton } from "@mui/material";
import { Delete } from "@mui/icons-material";

interface TestResultParameterProps {
  index: number;
  parameter: {
    parameter: string;
    value: string;
    unit: string;
    referenceRange: string;
  };
  onChange: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
}

const TestResultParameter: React.FC<TestResultParameterProps> = ({
  index,
  parameter,
  onChange,
  onRemove,
}) => {
  return (
    <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          label="Parameter"
          value={parameter.parameter}
          onChange={(e) => onChange(index, "parameter", e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          label="Value"
          value={parameter.value}
          onChange={(e) => onChange(index, "value", e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={2}>
        <TextField
          fullWidth
          label="Unit"
          value={parameter.unit}
          onChange={(e) => onChange(index, "unit", e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          label="Reference Range"
          value={parameter.referenceRange}
          onChange={(e) => onChange(index, "referenceRange", e.target.value)}
        />
      </Grid>
      <Grid item xs={12} sm={1}>
        <IconButton onClick={() => onRemove(index)} color="error">
          <Delete />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default TestResultParameter;