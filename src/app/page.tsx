import { Dashboard } from "@/components/Dashboard";
import { loadDataset } from "@/lib/data";

export default function Page() {
  return <Dashboard {...loadDataset()} />;
}
