import { OG_SIZE, renderCard } from "@/lib/card";

export const alt = "The Fast Takeoff Index: how many AI breakthroughs a month";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderCard("breakthroughs", "month", OG_SIZE);
}
