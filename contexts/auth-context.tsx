"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import type { UserProfile } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  invalidStudent: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseDisplayName(displayName: string | null): {
  grade: number;
  classNum: number;
  number: number;
  name: string;
} | null {
  if (!displayName) return null;

  // First 5 digits: grade(1) + class(2) + number(2), rest is name
  const match = displayName.match(/^(\d)(\d{2})(\d{2})\s*(.+)$/);
  if (!match) return null;

  return {
    grade: Number.parseInt(match[1], 10),
    classNum: Number.parseInt(match[2], 10),
    number: Number.parseInt(match[3], 10),
    name: match[4].trim(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalidStudent, setInvalidStudent] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setInvalidStudent(false);

      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile({
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: data.name,
          grade: data.grade,
          class: data.class,
          number: data.number,
          baseMileage: data.baseMileage || 0,
          multiplier: data.multiplier || 1.0,
          stampCount: data.stampCount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      } else {
        const parsed = parseDisplayName(firebaseUser.displayName);

        // ❗ 여기서 분기
        if (!parsed) {
          console.warn("학생 계정 아님:", firebaseUser.displayName);
          setUserProfile(null);
          setInvalidStudent(true);
          setLoading(false);
          return;
        }

        const newProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: parsed.name,
          grade: parsed.grade,
          class: parsed.classNum,
          number: parsed.number,
          baseMileage: 0,
          multiplier: 1.0,
          stampCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userDocRef, newProfile);

        setUserProfile({
          ...newProfile,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google 로그인 실패:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error("로그아웃 실패:", error);
      throw error;
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user || !userProfile) throw new Error("로그인이 필요합니다");

    await setDoc(
      doc(db, "users", user.uid),
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setUserProfile((prev) =>
      prev ? { ...prev, ...data, updatedAt: new Date() } : null
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        invalidStudent,
        signInWithGoogle,
        signOut,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
