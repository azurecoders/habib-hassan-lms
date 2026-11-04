import ImageKit from "imagekit";

let imagekitInstance: ImageKit | null = null;

export function getImageKitClient(): ImageKit | null {
  if (imagekitInstance) return imagekitInstance;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    return null;
  }

  imagekitInstance = new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });

  return imagekitInstance;
}

export function getImageKitAuth() {
  const ik = getImageKitClient();
  if (!ik) {
    return {
      configured: false,
      token: "",
      expire: 0,
      signature: "",
    };
  }

  const authenticationParameters = ik.getAuthenticationParameters();
  return {
    configured: true,
    ...authenticationParameters,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
  };
}

export async function uploadToImageKit(
  fileBufferOrBase64: string | Buffer,
  fileName: string,
  folder = "/school_lms"
): Promise<{ url: string; fileId?: string }> {
  const ik = getImageKitClient();
  if (!ik) {
    // Graceful fallback when credentials aren't set yet: return a placeholder URL or data URI
    return {
      url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`,
    };
  }

  const response = await ik.upload({
    file: fileBufferOrBase64,
    fileName,
    folder,
  });

  return {
    url: response.url,
    fileId: response.fileId,
  };
}
