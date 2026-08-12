import AppRoutes from "@/routes/app-routes";
import ThemeProvider from "@/components/theme-provider/theme-provider";

export default function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}
