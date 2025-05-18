import "./index.css";
import { APITester } from "./APITester";
import { Card, CardContent } from "@/components/ui/card";

import logo from "./logo.svg";
import reactLogo from "./react.svg";
import { useDataStore } from "./data/useDataStore";
import RoutesTable from "./components/routes-table";
import { routesData } from "./data/routes";
export function App() {
  const routes = useDataStore((state) => state.routes);
  const routesById = useDataStore((state) => state.routesById);

  const first10Routes = routes.slice(0, 10);
  console.log({
    routes,
    routesById,
    first10Routes,
  });

  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <Card className="bg-card/50 backdrop-blur-sm border-muted">
        <CardContent className="">
          <div className="h-full">
            <RoutesTable data={routes} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
