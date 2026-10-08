export const getDashboardRoute = (roleInput?: string | { name: string } | null): string => {
  if (!roleInput) return "/login";

  const rawRole =
    typeof roleInput === "object" ? roleInput.name : roleInput;
  const role = (rawRole || "").trim().toUpperCase();

  switch (role) {
    case "ADMINISTRATOR":
    case "ADMIN":
    case "MD":
      return "/dashboard";
    case "DOCTOR":
      return "/doctor";
    case "NURSE":
      return "/nurse";
    case "RECEPTIONIST":
    case "RECEPTION_CASHIER":
    case "RECEPTION":
    case "CASHIER":
    case "ACCOUNTANT":
    case "FINANCE":
      return "/reception";
    case "PHARMACIST":
      return "/pharmacy";
    case "LAB_TECH":
    case "LAB_TECHNICIAN":
    case "LAB":
      return "/lab";
    default:
      return "/login";
  }
};