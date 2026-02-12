import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Switch } from "@/components/ui/switch";
const ThemeToggle = () => {
  const {
    theme,
    setTheme
  } = useTheme();
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  return <div className="flex items-center space-x-2">
      <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-500 dark:text-yellow-300" />
      <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} className="data-[state=checked]:bg-secondary data-[state=unchecked]:bg-secondary/70 
                   dark:data-[state=checked]:bg-secondary dark:data-[state=unchecked]:bg-secondary/50" />
      <Moon className="h-[1.2rem] w-[1.2rem] text-yellow-500" />
    </div>;
};
export default ThemeToggle;