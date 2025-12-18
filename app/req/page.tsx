"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, setDoc, serverTimestamp, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, PartyPopper, AlertTriangle } from "lucide-react"
import { LoginScreen } from "@/components/login-screen"

function NFCHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [status, setStatus] = useState<"loading" | "success" | "duplicate" | "error" | "invalid" | "used">("loading")
  const [boothName, setBoothName] = useState<string>("")

  const boothIdx = searchParams.get("boothIdx")
  const isUsed = searchParams.get("used")

  useEffect(() => {
    if (boothIdx && isUsed !== "True") {
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set("used", "True")
      window.history.replaceState({}, "", currentUrl.toString())
      return
    }

    if (isUsed === "True" && boothIdx) {
      setStatus("used")
      return
    }

    const processVisit = async () => {
      if (loading) return
      if (!user || !userProfile) return
      if (!boothIdx) {
        setStatus("invalid")
        return
      }

      try {
        const boothsSnapshot = await getDoc(doc(db, "booths", boothIdx))

        if (!boothsSnapshot.exists()) {
          setStatus("invalid")
          return
        }

        const boothData = boothsSnapshot.data()
        setBoothName(boothData.name)

        // 이미 방문했는지 확인
        const visitRef = doc(db, "users", userProfile.uid, "boothVisits", boothIdx)
        const visitDoc = await getDoc(visitRef)

        if (visitDoc.exists()) {
          setStatus("duplicate")
          return
        }

        // 방문 기록 생성
        await setDoc(visitRef, {
          boothId: boothIdx,
          visitedAt: serverTimestamp(),
          mileageEarned: 100,
        })

        await setDoc(
          doc(db, "booths", boothIdx),
          {
            visitCount: increment(1),
          },
          { merge: true },
        )

        // 사용자 마일리지 및 스탬프 업데이트
        await setDoc(
          doc(db, "users", userProfile.uid),
          {
            baseMileage: increment(100),
            stampCount: increment(1),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )

        // 로그 기록
        await setDoc(doc(db, "users", userProfile.uid, "logs", `visit_${boothIdx}_${Date.now()}`), {
          type: "visit",
          boothId: boothIdx,
          mileageChange: 100,
          timestamp: serverTimestamp(),
        })

        setStatus("success")
      } catch (error) {
        console.error("방문 처리 실패:", error)
        setStatus("error")
      }
    }

    processVisit()
  }, [boothIdx, isUsed, user, userProfile, loading])

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">로딩 중...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 로그인 필요
  if (!user) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        {status === "loading" && (
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">부스 방문 처리 중...</p>
          </CardContent>
        )}

        {status === "success" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <CardTitle className="text-xl">방문 완료!</CardTitle>
              <CardDescription>{boothName}에 방문하셨습니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg text-center">
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">마일리지</p>
                    <p className="text-xl font-bold text-primary">+100</p>
                  </div>
                  <div className="w-px h-10 bg-border" />
                  <div>
                    <p className="text-sm text-muted-foreground">스탬프</p>
                    <p className="text-xl font-bold text-primary">+1</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => router.push("/")} className="w-full">
                <PartyPopper className="w-4 h-4 mr-2" />
                홈으로 이동
              </Button>
            </CardContent>
          </>
        )}

        {(status === "duplicate" || status === "used") && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="w-10 h-10 text-amber-600" />
              </div>
              <CardTitle className="text-xl">{status === "duplicate" ? "이미 방문한 부스" : "사용된 URL"}</CardTitle>
              <CardDescription>
                {status === "duplicate"
                  ? `${boothName}은(는) 이미 방문 처리되었습니다`
                  : "이 URL은 이미 사용되었습니다"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-muted-foreground mb-4">
                {status === "duplicate"
                  ? "같은 부스는 한 번만 마일리지를 받을 수 있습니다."
                  : "NFC 태그를 직접 태그해주세요."}
              </p>
              <Button onClick={() => router.push("/")} className="w-full" variant="outline">
                홈으로 이동
              </Button>
            </CardContent>
          </>
        )}

        {status === "invalid" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <CardTitle className="text-xl">잘못된 요청</CardTitle>
              <CardDescription>유효하지 않은 부스 정보입니다</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/")} className="w-full" variant="outline">
                홈으로 이동
              </Button>
            </CardContent>
          </>
        )}

        {status === "error" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <CardTitle className="text-xl">오류 발생</CardTitle>
              <CardDescription>방문 처리 중 문제가 발생했습니다</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-center text-muted-foreground mb-4">잠시 후 다시 시도해주세요.</p>
              <Button onClick={() => window.location.reload()} className="w-full">
                다시 시도
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}

export default function NFCRequestPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <NFCHandler />
    </Suspense>
  )
}
