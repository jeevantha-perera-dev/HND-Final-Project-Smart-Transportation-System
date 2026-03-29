import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./client";

const AVATAR_PATH = (userId: string) => `avatars/${userId}/profile.jpg`;

export async function uploadProfileAvatar(userId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const contentType =
    blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
  const fileRef = ref(storage, AVATAR_PATH(userId));
  await uploadBytes(fileRef, blob, { contentType });
  return getDownloadURL(fileRef);
}

export async function deleteProfileAvatar(userId: string): Promise<void> {
  try {
    await deleteObject(ref(storage, AVATAR_PATH(userId)));
  } catch {
    /* file may not exist */
  }
}
