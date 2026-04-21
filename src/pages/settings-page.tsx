import { useTheme } from "@/contexts/theme-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <Card className="space-y-3">
        <p className="text-sm text-slate-300">Theme</p>
        <div className="flex gap-2">
          <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
            Dark
          </Button>
          <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
            Light
          </Button>
        </div>
      </Card>
    </div>
  );
}
