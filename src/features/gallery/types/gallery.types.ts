export type BeforePosition = "left" | "right";

export interface GalleryPublicCase {
  id: string;
  url: string;
  thumbnail_url: string;
  procedure_tag: string;
  timeframe_badge: string;
  before_position: BeforePosition;
  width: number;
  height: number;
}

export interface GalleryStatistic {
  key: string;
  value: string;
  label: string;
}

export interface GallerySectionContent {
  type: "gallery_section";
  lang: string;
  eyebrow: string;
  heading: string;
  introduction: string;
  statistics: GalleryStatistic[];
}

export interface GalleryCaptionContent {
  type: "gallery_caption";
  image_id: string;
  lang: string;
  alt_text: string;
  caption: string;
}

export type GalleryContentItem = GallerySectionContent | GalleryCaptionContent;

export interface GalleryListResponse {
  data: GalleryPublicCase[];
  page: number;
  page_size: number;
  total: number;
}

export interface GalleryContentResponse {
  data: GalleryContentItem[];
}

export interface GalleryQueryParams {
  page?: number;
  page_size?: number;
  procedure_tag?: string;
  timeframe_badge?: string;
}

export interface GalleryFilterOption {
  value: string;
  labelKey: string;
}

export interface GalleryFilterOptions {
  procedures: GalleryFilterOption[];
  timeframes: GalleryFilterOption[];
}

export interface GalleryBrowserProps {
  initialCases?: GalleryPublicCase[];
  initialTotal?: number;
  initialPage?: number;
  initialCaptions?: Record<string, GalleryCaptionContent>;
  initialSectionContent?: GallerySectionContent | null;
}

export interface GalleryCardProps {
  item: GalleryPublicCase;
  caption?: GalleryCaptionContent;
  onEnlarge: (item: GalleryPublicCase) => void;
  priority?: boolean;
}

export type GalleryComparisonVariant = "featured" | "thumbnail";

export interface GalleryComparisonProps {
  item: GalleryPublicCase;
  caption?: GalleryCaptionContent;
  priority?: boolean;
  variant?: GalleryComparisonVariant;
  className?: string;
}

export interface GalleryLightboxProps {
  item: GalleryPublicCase | null;
  caption?: GalleryCaptionContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}


