// lib/admin.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * admins/{uid} 문서가 존재하면 관리자
 */
export async function isAdminUid(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "admins", uid));
  return snap.exists();
}
