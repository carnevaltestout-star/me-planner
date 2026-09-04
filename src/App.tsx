import AppRoutes from "@/routes/app-routes";
import ThemeProvider from "@/components/theme-provider/theme-provider";
import MusicProvider from "@/components/music-provider/music-provider";

export default function App() {
  return (
    <ThemeProvider>
      <MusicProvider>
        <AppRoutes />
      </MusicProvider>
    </ThemeProvider>
  );
}
