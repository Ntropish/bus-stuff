import { Card, CardContent } from "@/components/ui/card";

import RoutesTable from "@/components/routes-table";
import { useDataStore } from "@/data/useDataStore";

export default function Routes() {
  const routes = useDataStore((state) => state.routes);
  const routesById = useDataStore((state) => state.routesById);

  const first10Routes = routes.slice(0, 10);
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-muted overflow-hidden">
      <CardContent className="p-0 overflow-hidden">
        <RoutesTable data={routes} />
      </CardContent>
    </Card>
  );
}
