import { v2 as cloudinary } from "cloudinary";
import { requireRole } from "@/lib/auth";

export async function POST() {
  const user = await requireRole("PROVIDER");
  if (!user?.agency) return Response.json({ error: "Alleen aanbieders met een kantoorprofiel kunnen foto's uploaden." }, { status: 403 });
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return Response.json({ error: "Afbeeldingen uploaden is nog niet geconfigureerd." }, { status: 503 });
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET, secure: true });
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "thuiszoek/listings";
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, CLOUDINARY_API_SECRET);
  return Response.json({ cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, timestamp, folder, signature });
}
