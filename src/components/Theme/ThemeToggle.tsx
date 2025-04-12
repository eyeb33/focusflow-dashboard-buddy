
import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Switch } from "@/components/ui/switch";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  return (
    <div className="flex items-center space-x-1">
      <Sun className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
      <Switch 
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
        className="data-[state=checked]:bg-black"
      />
      <Moon className="h-[1.2rem] w-[1.2rem] text-muted-foreground" />
    </div>
  );
};

export default ThemeToggle;
