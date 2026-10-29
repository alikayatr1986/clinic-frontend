import type {
  GalleryCaptionContent,
  GalleryPublicCase,
  GallerySectionContent,
} from "@/features/gallery/types/gallery.types";
import type { BlogHome } from "@/features/blogs/types/blogs.types";

export interface GallerySectionProps {
  initialCases?: GalleryPublicCase[];
  initialContent?: GallerySectionContent | null;
  initialCaptions?: Record<string, GalleryCaptionContent>;
}

export interface BlogsSectionProps {
  initialHome?: BlogHome;
}

