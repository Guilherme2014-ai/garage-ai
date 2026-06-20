import Image from "next/image";

type Build = {
  handle: string;
  likes: string;
  src: string;
  alt: string;
};

const BUILDS: Build[] = [
  {
    handle: "@mk7.widebody",
    likes: "1.4K",
    src: "/assets/gallery/jetta-euro.png",
    alt: "Widebody VW Jetta with race wing on bronze wheels",
  },
  {
    handle: "@bimmer.life",
    likes: "2.1K",
    src: "/assets/gallery/bmw-euro.png",
    alt: "White BMW 3 Series with carbon hood and bronze wheels",
  },
  {
    handle: "@gol.gti",
    likes: "932",
    src: "/assets/gallery/gol-euro.png",
    alt: "Widebody VW Gol hatch with carbon hood and rear wing",
  },
  {
    handle: "@blacked.fusion",
    likes: "1.7K",
    src: "/assets/gallery/fusion-muscle.png",
    alt: "Murdered-out Ford Fusion on bronze wheels",
  },
  {
    handle: "@carbon.onix",
    likes: "1.1K",
    src: "/assets/gallery/onix-muscle.png",
    alt: "Chevrolet Onix track build with carbon hood and livery",
  },
  {
    handle: "@fortuner.build",
    likes: "1.3K",
    src: "/assets/gallery/fortuner-blue-trucks.png",
    alt: "Widebody Toyota Fortuner SUV with blue underglow",
  },
];

export function Gallery() {
  return (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {BUILDS.map((build) => (
        <div
          key={build.handle}
          className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10"
        >
          <Image
            src={build.src}
            alt={build.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500" />
              <span className="font-medium text-white text-xs">
                {build.handle}
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/90 text-xs">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-violet-400"
                aria-hidden="true"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {build.likes}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
