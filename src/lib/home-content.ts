// Contenido editable de la portada. Para usar videos propios, copiá los archivos en
// `public/videos/` y completá `video` (y opcionalmente `poster`) con su ruta pública.

export type HeroSlide = {
  id: string;
  kicker: string;
  title: string;
  highlight: string;
  subtitle: string;
  cta: { label: string; href: string };
  video?: string;
  poster?: string;
  theme: "amber" | "steel" | "toxic";
};

export type ShortVideo = { id: string; title: string; video?: string; poster?: string };
export type StoreReview = { id: string; author: string; city: string; date: string; rating: number; text: string };
export type HomeCategory = { id: string; label: string; href: string; icon: CategoryIcon };
export type CategoryIcon = "droplets" | "armchair" | "shield" | "sparkles" | "brush" | "lightbulb" | "package" | "tag" | "car";

export const heroSlides: HeroSlide[] = [
  {
    id: "lavado",
    kicker: "Limpieza, brillo y protección",
    title: "Tu auto impecable,",
    highlight: "empieza acá",
    subtitle: "Shampoo, ceras y accesorios para cuidar cada detalle de tu vehículo.",
    cta: { label: "Ver productos", href: "/#catalogo" },
    theme: "amber",
  },
  {
    id: "proteccion",
    kicker: "Terminación de nivel profesional",
    title: "Brillo que",
    highlight: "se nota",
    subtitle: "Ceras y selladores para proteger la pintura del sol, el agua y la suciedad.",
    cta: { label: "Conocé la línea de protección", href: "/#catalogo" },
    theme: "steel",
  },
  {
    id: "accesorios",
    kicker: "Todo para tu rutina de detailing",
    title: "Las herramientas",
    highlight: "correctas",
    subtitle: "Cepillos, microfibras y luces LED para trabajar cómodo y rápido.",
    cta: { label: "Ver accesorios", href: "/#catalogo" },
    theme: "toxic",
  },
];

export const homeCategories: HomeCategory[] = [
  { id: "lavado", label: "Lavado", href: "/#catalogo", icon: "droplets" },
  { id: "interior", label: "Limpieza interior", href: "/#catalogo", icon: "armchair" },
  { id: "proteccion", label: "Protección", href: "/#catalogo", icon: "shield" },
  { id: "brillo", label: "Ceras y brillo", href: "/#catalogo", icon: "sparkles" },
  { id: "cepillos", label: "Cepillos y microfibras", href: "/#catalogo", icon: "brush" },
  { id: "iluminacion", label: "Iluminación LED", href: "/#catalogo", icon: "lightbulb" },
  { id: "kits", label: "Kits", href: "/#catalogo", icon: "package" },
  { id: "ofertas", label: "Ofertas", href: "/#catalogo", icon: "tag" },
];

export const shortVideos: ShortVideo[] = [
  { id: "lavado-dos-baldes", title: "Lavado con dos baldes" },
  { id: "aplicar-cera", title: "Cómo aplicar cera" },
  { id: "interior", title: "Limpieza de tapizados" },
  { id: "llantas", title: "Llantas como nuevas" },
  { id: "microfibras", title: "Cuidado de microfibras" },
];

// Cargá acá reseñas reales de clientes. Mientras la lista esté vacía, la sección no se muestra.
export const storeReviews: StoreReview[] = [];
