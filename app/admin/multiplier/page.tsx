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
  updateDoc,
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

export default function MultiplierAdminPage() {
  const [studentId, setStudentId] = useState("");
  const [multiplier, setMultiplier] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMessage(null);

    const parsed = parseStudentId(studentId);
    if (!parsed) {
      setMessage("학번은 5자리 숫자로 입력해주세요.");
      return;
    }

    if (!multiplier) {
      setMessage("배수를 입력해주세요.");
      return;
    }

    const m = Number(multiplier);

    if (!Number.isFinite(m) || m <= 0) {
      setMessage("배수는 0보다 큰 숫자여야 합니다.");
      return;
    }

    if (m > 2) {
      setMessage("배수는 최대 2까지 설정할 수 있습니다.");
      return;
    }

    setLoading(true);

    try {
      const { grade, classNum, number } = parsed;

      const q = query(
        collection(db, "users"),
        where("grade", "==", grade),
        where("class", "==", classNum),
        where("number", "==", number)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setMessage("해당 학번의 학생을 찾을 수 없습니다.");
        return;
      }

      const userDoc = snapshot.docs[0];
      const data = userDoc.data();

      if (data.multiplier !== 1) {
        setMessage("이미 배수가 설정된 학생입니다.");
        return;
      }

      await updateDoc(doc(db, "users", userDoc.id), {
        multiplier: m,
      });

      setMessage(`${studentId} 학생의 배수를 x${m}로 설정했습니다.`);

      setStudentId("");
      setMultiplier("");
    } catch (err) {
      console.error(err);
      setMessage("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen p-4 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>마일리지 배수 관리</CardTitle>
            <CardDescription>
              학번으로 학생을 선택해 배수를 <b>한 번만</b> 설정합니다.
              <br />
              (최대 x2)
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
              placeholder="배수 (0 초과, 최대 2)"
              value={multiplier}
              onChange={(e) => setMultiplier(e.target.value)}
              inputMode="decimal"
            />

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full"
            >
              배수 적용
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
