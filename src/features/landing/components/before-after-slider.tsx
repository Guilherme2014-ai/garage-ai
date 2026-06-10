import Image from "next/image";

export function BeforeAfterShowcase() {
  return (
    <div className="relative">
      <div className="-inset-8 absolute rounded-[2.5rem] bg-violet-600/20 blur-3xl" />
      <div className="-top-10 -right-10 absolute hidden h-40 w-40 rounded-full bg-blue-500/20 blur-3xl lg:block" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-violet-950/50">
        <Image
          src="/assets/before-and-after.png"
          alt="A car shown before and after customization with Garage AI"
          width={1063}
          height={794}
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}
