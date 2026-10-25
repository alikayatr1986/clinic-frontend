import type {
  GalleryCaptionContent,
  GalleryContentResponse,
  GalleryListResponse,
  GalleryPublicCase,
  GalleryQueryParams,
  GallerySectionContent,
} from "../types/gallery.types";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8080"
  );
}

export async function fetchLandingGalleryCases(
  pageSize = 5,
): Promise<GalleryPublicCase[]> {
  try {
    const url = `${getBaseUrl()}/api/v1/gallery?page=1&page_size=${pageSize}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      return [];
    }
    const json: GalleryListResponse = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function fetchGalleryCases(
  params: GalleryQueryParams = {},
): Promise<GalleryListResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined && params.page > 0) {
    query.set("page", String(params.page));
  }
  if (params.page_size !== undefined && params.page_size > 0) {
    query.set("page_size", String(params.page_size));
  }
  if (params.procedure_tag) {
    query.set("procedure_tag", params.procedure_tag);
  }
  if (params.timeframe_badge) {
    query.set("timeframe_badge", params.timeframe_badge);
  }

  const qs = query.toString();
  const url = `${getBaseUrl()}/api/v1/gallery${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const error = new Error(`Gallery API returned status ${res.status}`);
    (error as unknown as { status: number }).status = res.status;
    throw error;
  }

  const json: GalleryListResponse = await res.json();
  return json;
}

export interface GalleryContentData {
  section: GallerySectionContent | null;
  captions: Record<string, GalleryCaptionContent>;
}

export async function fetchGalleryContent(
  lang: string,
  imageIds: string[] = [],
): Promise<GalleryContentData> {
  try {
    const query = new URLSearchParams({ lang });
    if (imageIds.length > 0) {
      query.set("image_ids", imageIds.join(","));
    }
    const url = `${getBaseUrl()}/api/v1/gallery-content?${query.toString()}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      return { section: null, captions: {} };
    }
    const json: GalleryContentResponse = await res.json();
    let section: GallerySectionContent | null = null;
    const captions: Record<string, GalleryCaptionContent> = {};

    for (const item of json.data || []) {
      if (item.type === "gallery_section") {
        section = item;
      } else if (item.type === "gallery_caption") {
        captions[item.image_id] = item;
      }
    }

    return { section, captions };
  } catch {
    return { section: null, captions: {} };
  }
}

