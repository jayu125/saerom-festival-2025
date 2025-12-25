"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/admin-gurad";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function parseStudentId(studentId: string) {
  if (!/^\d{5}$/.test(studentId)) return null;
  return {
    grade: Number(studentId[0]),
    classNum: Number(studentId.slice(1, 3)),
    number: Number(studentId.slice(3, 5)),
  };
}

/**
 * baseMileage에서 delta만큼 빼면 display가 얼마나 줄어드는지 계산은
 * display = floor(base * m)
 *
 * 목표: display를 spendDisplay 만큼 줄이기
 * => floor((base - delta) * m) <= floor(base*m) - spendDisplay
 *
 * delta를 "최소"로 찾아서 floor로 인한 과차감을 최대한 줄임
 */
function findMinBaseDelta(
  base: number,
  m: number,
  spendDisplay: number
): number {
  if (spendDisplay <= 0) return 0;
  if (!Number.isFinite(base) || base <= 0) return 0;
  if (!Number.isFinite(m) || m <= 0) return 0;

  const currentDisplay = Math.floor(base * m);
  const targetDisplay = Math.max(0, currentDisplay - spendDisplay);

  // 이미 0이면 더 못 줄임
  if (currentDisplay <= 0) return 0;

  // 대충 상한(이 정도면 충분히 내려감)
  // spendDisplay / m 만큼 base를 줄이면 display가 spendDisplay 정도 줄어들 가능성이 큼
  // floor 오차 고려해서 +2 여유
  let lo = 0;
  let hi = Math.min(base, Math.ceil(spendDisplay / m) + 2);

  // 혹시 hi로도 목표를 못 맞추면 hi를 확장
  while (hi < base && Math.floor((base - hi) * m) > targetDisplay) {
    hi = Math.min(base, hi * 2);
  }

  // 이진 탐색으로 최소 delta 찾기
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const nextDisplay = Math.floor((base - mid) * m);
    if (nextDisplay <= targetDisplay) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  return lo;
}

export default function RedeemAdminPage() {
  const [studentId, setStudentId] = useState("");
  const [spendDisplay, setSpendDisplay] = useState("");
  const [itemName, setItemName] = useState(""); // 선택: 상품명 로그용
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMessage(null);

    const parsed = parseStudentId(studentId);
    if (!parsed) {
      setMessage("학번은 5자리 숫자로 입력해주세요.");
      return;
    }

    const spend = Number(spendDisplay);
    if (!Number.isFinite(spend) || spend <= 0) {
      setMessage("차감할 마일리지는 1 이상의 숫자로 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const { grade, classNum, number } = parsed;

      // ✅ 네가 쓰는 방식 그대로: grade/class/number로 users 검색
      const qy = query(
        collection(db, "users"),
        where("grade", "==", grade),
        where("class", "==", classNum),
        where("number", "==", number)
      );

      const snapshot = await getDocs(qy);

      if (snapshot.empty) {
        setMessage("해당 학번의 학생을 찾을 수 없습니다.");
        return;
      }

      const userDoc = snapshot.docs[0];
      const userRef = doc(db, "users", userDoc.id);

      await runTransaction(db, async (tx) => {
        const freshSnap = await tx.get(userRef);
        if (!freshSnap.exists())
          throw new Error("유저 문서를 찾을 수 없습니다.");

        const data = freshSnap.data() as any;
        const base = Number(data.baseMileage ?? 0);
        const m = Number(data.multiplier ?? 1);

        if (!Number.isFinite(base) || base < 0) {
          throw new Error("baseMileage가 비정상입니다.");
        }
        if (!Number.isFinite(m) || m <= 0) {
          throw new Error("multiplier가 비정상입니다.");
        }

        const currentDisplay = Math.floor(base * m);
        if (currentDisplay < spend) {
          throw new Error(
            `잔액 부족: 현재 표시 마일리지 ${currentDisplay} / 필요 ${spend}`
          );
        }

        const deltaBase = findMinBaseDelta(base, m, spend);

        const nextBase = base - deltaBase;
        if (nextBase < 0)
          throw new Error("차감 결과 baseMileage가 음수가 됩니다.");

        // 업데이트
        tx.update(userRef, {
          baseMileage: nextBase,
          updatedAt: serverTimestamp(),
        });

        // 로그 남기기(선택)
        const logRef = doc(
          db,
          "users",
          userDoc.id,
          "logs",
          `redeem_${Date.now()}`
        );

        tx.set(logRef, {
          type: "redeem",
          studentId,
          itemName: itemName || null,
          spendDisplay: spend, // 사용자가 입력한 '표시 마일리지 기준 차감'
          multiplier: m,
          baseBefore: base,
          baseDelta: deltaBase,
          baseAfter: nextBase,
          displayBefore: currentDisplay,
          displayAfter: Math.floor(nextBase * m),
          timestamp: serverTimestamp(),
        });
      });

      setMessage(
        `${studentId} 학생: 표시 마일리지 ${spend} 차감 완료 (상품: ${
          itemName || "미기입"
        })`
      );
      setStudentId("");
      setSpendDisplay("");
      setItemName("");
    } catch (err) {
      console.error(err);
      setMessage(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen p-4 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>상품 구매(마일리지 차감)</CardTitle>
            <CardDescription>
              학번으로 학생을 찾고, <b>표시 마일리지 기준</b>으로 차감합니다.
              <br />
              (표시 마일리지 = floor(baseMileage × multiplier))
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Input
              placeholder="학번 5자리 (예: 10215)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              inputMode="numeric"
            />

            <Input
              placeholder="차감할 표시 마일리지 (예: 300)"
              value={spendDisplay}
              onChange={(e) => setSpendDisplay(e.target.value)}
              inputMode="numeric"
            />

            <Input
              placeholder="상품명(선택) (예: 교환권)"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              {loading ? "처리 중..." : "구매(차감) 적용"}
            </Button>

            {message && (
              <p className="text-sm text-center text-muted-foreground">
                {message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminGuard>
  );
}
