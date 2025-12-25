"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  increment,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Loader2,
  PartyPopper,
  AlertTriangle,
} from "lucide-react";
import { LoginScreen } from "@/components/login-screen";

function NFCHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userProfile, loading, updateUserProfile } = useAuth();

  const [status, setStatus] = useState<
    "loading" | "success" | "duplicate" | "error" | "invalid" | "used"
  >("loading");
  const [boothName, setBoothName] = useState("");

  const boothIdx = searchParams.get("boothIdx");
  const u = searchParams.get("u"); // ✅ 0 / 1

  const initialUsedRef = useRef<boolean | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (loading) return;

    // boothIdx 없으면 invalid
    if (!boothIdx) {
      setStatus("invalid");
      return;
    }

    // 🔒 최초 진입 시 u 값 고정
    if (initialUsedRef.current === null) {
      initialUsedRef.current = u === "1";
    }

    // ❗ 이미 사용된 URL
    if (initialUsedRef.current) {
      setStatus("used");
      return;
    }

    // 중복 실행 방지
    if (processedRef.current) return;
    processedRef.current = true;

    // URL에 u=0 강제 반영 (처리 중)
    {
      const url = new URL(window.location.href);
      if (!url.searchParams.get("u")) {
        url.searchParams.set("u", "0");
        window.history.replaceState({}, "", url.toString());
      }
    }

    const processVisit = async () => {
      if (!user || !userProfile) {
        processedRef.current = false;
        return;
      }

      try {
        setStatus("loading");

        // boothIdx로 booth 조회
        const boothQuery = query(
          collection(db, "booths"),
          where("boothIdx", "==", Number(boothIdx))
        );
        const boothSnapshot = await getDocs(boothQuery);

        if (boothSnapshot.size !== 1) {
          setStatus("invalid");
          return;
        }

        const boothDoc = boothSnapshot.docs[0];
        const boothData = boothDoc.data();
        const boothDocId = boothDoc.id;

        setBoothName(boothData.name);

        // 방문 중복 체크
        const visitRef = doc(
          db,
          "users",
          userProfile.uid,
          "boothVisits",
          boothIdx
        );
        const visitSnap = await getDoc(visitRef);

        if (visitSnap.exists()) {
          setStatus("duplicate");
        } else {
          // 방문 기록
          await setDoc(visitRef, {
            boothIdx: Number(boothIdx),
            boothDocId,
            visitedAt: serverTimestamp(),
            mileageEarned: 100,
          });

          // booth visitCount 증가
          await setDoc(
            doc(db, "booths", boothDocId),
            { visitCount: increment(1) },
            { merge: true }
          );

          // 유저 마일리지/스탬프
          await setDoc(
            doc(db, "users", userProfile.uid),
            {
              baseMileage: increment(100),
              stampCount: increment(1),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );

          // 로그
          await setDoc(
            doc(
              db,
              "users",
              userProfile.uid,
              "logs",
              `visit_${boothIdx}_${Date.now()}`
            ),
            {
              type: "visit",
              boothIdx: Number(boothIdx),
              boothDocId,
              mileageChange: 100,
              timestamp: serverTimestamp(),
            }
          );

          await updateUserProfile({
            baseMileage: (userProfile.baseMileage ?? 0) + 100,
            stampCount: (userProfile.stampCount ?? 0) + 1,
          });

          setStatus("success");
        }

        // ✅ 처리 완료 → u=1
        const url = new URL(window.location.href);
        url.searchParams.set("u", "1");
        window.history.replaceState({}, "", url.toString());
      } catch (err) {
        console.error("[NFC ERROR]", err);
        setStatus("error");
      }
    };

    processVisit();
  }, [boothIdx, u, user, userProfile, loading, updateUserProfile]);

  // 로딩
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // 로그인 필요
  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        {status === "loading" && (
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>부스 방문 처리 중...</p>
          </CardContent>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <CardTitle>방문 완료!</CardTitle>
              <CardDescription>{boothName} 방문</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/")}>
                <PartyPopper className="w-4 h-4 mr-2" />
                홈으로 이동
              </Button>
            </CardContent>
          </>
        )}

        {(status === "duplicate" || status === "used") && (
          <>
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-2" />
              <CardTitle>
                {status === "duplicate" ? "이미 방문한 부스" : "사용된 NFC"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/")}
              >
                홈으로 이동
              </Button>
            </CardContent>
          </>
        )}

        {(status === "invalid" || status === "error") && (
          <>
            <CardHeader className="text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
              <CardTitle>처리 실패</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => router.push("/")}
                variant="outline"
              >
                홈으로 이동
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

export default function NFCRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <NFCHandler />
    </Suspense>
  );
}
