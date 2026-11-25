import { Problems } from "@/components/Problems";
import { loadDataset } from "@/lib/data";

export default function Page() {
  return <Problems problems={loadDataset().problems} />;
}
