import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function parseStudentId(studentId: string) {
  if (!/^\d{5}$/.test(studentId)) return null;
  return {
    grade: Number(studentId[0]),
    classNum: Number(studentId.slice(1, 3)),
    number: Number(studentId.slice(3, 5)),
  };
}

/**
 * users/{uid} 없으면 생성
 * multiplier 초기값: 0 (요구사항에 맞게!)
 */
export async function ensureUserProfile(params: {
  uid: string;
  studentId: string;
  name: string;
  email?: string;
}) {
  const parsed = parseStudentId(params.studentId);
  if (!parsed) throw new Error("invalid studentId");

  const ref = doc(db, "users", params.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) return;

  await setDoc(ref, {
    uid: params.uid,
    email: params.email ?? "",
    name: params.name,
    grade: parsed.grade,
    class: parsed.classNum,
    number: parsed.number,
    baseMileage: 0,
    multiplier: 1, // ✅ 초기값 0
    stampCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
