export type GlassPreset = {
  surface: string;
  specular: string;
};

export const glass: Record<"subtle" | "medium" | "strong", GlassPreset> = {
  subtle: {
    surface:
      "bg-white/70 dark:bg-gray-900/60 " +
      "backdrop-blur-md " +
      "ring-1 ring-white/40 dark:ring-white/10 " +
      "shadow-[0_4px_16px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(255,255,255,0.2)] " +
      "dark:shadow-[0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(255,255,255,0.02)]",
    specular:
      "absolute inset-x-3 top-0.5 h-1/3 rounded-full " +
      "bg-gradient-to-b from-white/60 to-transparent opacity-70 blur-[1px]",
  },
  medium: {
    surface:
      "bg-white/55 dark:bg-gray-900/40 " +
      "backdrop-blur-2xl " +
      "ring-1 ring-white/60 dark:ring-white/10 " +
      "shadow-[0_8px_32px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.75),inset_0_-1px_0_rgba(255,255,255,0.35)] " +
      "dark:shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06),inset_0_-1px_0_rgba(255,255,255,0.03)]",
    specular:
      "absolute inset-x-3 top-0.5 h-1/2 rounded-full " +
      "bg-gradient-to-b from-white/70 to-transparent opacity-80 blur-[1px]",
  },
  strong: {
    surface:
      "bg-white/40 dark:bg-gray-900/25 " +
      "backdrop-blur-3xl " +
      "ring-1 ring-white/80 dark:ring-white/20 " +
      "shadow-[0_12px_40px_rgba(15,23,42,0.16),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(255,255,255,0.5)] " +
      "dark:shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(255,255,255,0.05)]",
    specular:
      "absolute inset-x-4 top-1 h-1/2 rounded-full " +
      "bg-gradient-to-b from-white/90 to-transparent opacity-100 blur-[1px]",
  },
};
