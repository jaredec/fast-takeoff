import { Week } from "@/components/Week";
import { loadDataset } from "@/lib/data";

export default function Page() {
  const { meta, daily, tracks } = loadDataset();
  return <Week meta={meta} daily={daily} breakthroughs={tracks.breakthroughs} />;
}
