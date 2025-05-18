import "./index.css";
import { APITester } from "./APITester";
import { Card, CardContent } from "@/components/ui/card";

import logo from "./logo.svg";
import reactLogo from "./react.svg";
import { useDataStore } from "./data/useDataStore";
import RoutesTable from "./components/routes-table";
import { routesData } from "./data/routes";
import { Outlet } from "react-router";
export function App() {
  return (
    <div className="container mx-auto py-[1rem]">
      <Outlet />
    </div>
  );
}

export default App;
