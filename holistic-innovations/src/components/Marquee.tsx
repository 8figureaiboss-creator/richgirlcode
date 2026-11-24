import Lotus from "./Lotus";

const items = ["Overnight Newborn Care", "Postpartum Recovery", "Lactation Counseling", "Twins & Multiples", "Live-In Support", "Rotational Care", "Postpartum Meals", "Doula Mentorship"];

export default function Marquee() {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-teal-deep bg-teal py-5 text-white" aria-hidden="true">
      <div className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 font-display text-2xl italic">
            {t}
            <Lotus className="h-6 w-6 text-blush" mono arch={false} animate={false} />
          </span>
        ))}
      </div>
    </div>
  );
}
