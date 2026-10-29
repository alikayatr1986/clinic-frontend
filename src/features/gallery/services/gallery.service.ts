import { apiRequest } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "../constants/gallery.constants";
import type {
  GalleryCaptionContent,
  GalleryContentResponse,
  GalleryListResponse,
  GalleryPublicCase,
  GalleryQueryParams,
  GallerySectionContent,
} from "../types/gallery.types";

export interface FetchGalleryOptions {
  signal?: AbortSignal;
  headers?: HeadersInit;
  cache?: RequestCache;
}

export interface GalleryContentData {
  section: GallerySectionContent | null;
  captions: Record<string, GalleryCaptionContent>;
}

export async function fetchLandingGalleryCases(
  pageSize = 5,
  options: FetchGalleryOptions = {},
): Promise<GalleryPublicCase[]> {
  const size = Math.max(1, pageSize);
  const json = await apiRequest<GalleryListResponse>("/api/v1/gallery", {
    query: {
      page: 1,
      page_size: size,
    },
    signal: options.signal,
    headers: options.headers,
    cache: options.cache,
  });
  return json?.data ?? [];
}

export async function fetchGalleryCases(
  params: GalleryQueryParams = {},
  options: FetchGalleryOptions = {},
): Promise<GalleryListResponse> {
  const json = await apiRequest<GalleryListResponse>("/api/v1/gallery", {
    query: {
      page:
        params.page !== undefined && params.page > 0
          ? params.page
          : undefined,
      page_size:
        params.page_size !== undefined && params.page_size > 0
          ? params.page_size
          : undefined,
      procedure_tag: params.procedure_tag || undefined,
      timeframe_badge: params.timeframe_badge || undefined,
    },
    signal: options.signal,
    headers: options.headers,
    cache: options.cache,
  });

  return {
    data: json?.data ?? [],
    page: json?.page ?? (params.page ?? 1),
    page_size: json?.page_size ?? (params.page_size ?? DEFAULT_PAGE_SIZE),
    total: json?.total ?? 0,
  };
}

export async function fetchGalleryContent(
  lang: string,
  imageIds: string[] = [],
  options: FetchGalleryOptions = {},
): Promise<GalleryContentData> {
  const json = await apiRequest<GalleryContentResponse>(
    "/api/v1/gallery-content",
    {
      query: {
        lang,
        image_ids: imageIds.length > 0 ? imageIds : undefined,
      },
      signal: options.signal,
      headers: options.headers,
      cache: options.cache,
    },
  );

  let section: GallerySectionContent | null = null;
  const captions: Record<string, GalleryCaptionContent> = {};

  for (const item of json?.data || []) {
    if (item.type === "gallery_section") {
      section = item;
    } else if (item.type === "gallery_caption") {
      captions[item.image_id] = item;
    }
  }

  return { section, captions };
}
