"use client";

import { useState } from "react";
import styled from "styled-components";
import { AdminGuard } from "../admin-gurad";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function parseStudentId(studentId: string) {
  if (!/^\d{5}$/.test(studentId)) return null;
  return {
    grade: Number(studentId[0]),
    classNum: Number(studentId.slice(1, 3)),
    number: Number(studentId.slice(3, 5)),
  };
}

export default function WhitelistPage() {
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState(""); // 확인용/표시용 (선택)
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const register = async () => {
    setMsg("");

    const parsed = parseStudentId(studentId.trim());
    if (!parsed) return setMsg("학번은 5자리 숫자로 입력해주세요.");
    if (!name.trim()) return setMsg("이름을 입력해주세요. (확인용)");

    setBusy(true);
    try {
      const { grade, classNum, number } = parsed;

      // ✅ users에서 해당 학번 유저 찾기 (학생이 먼저 로그인했어야 존재)
      const q = query(
        collection(db, "users"),
        where("grade", "==", grade),
        where("class", "==", classNum),
        where("number", "==", number)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setMsg(
          "해당 학번의 users 문서를 찾지 못했습니다. (학생이 먼저 한 번 로그인해야 합니다)"
        );
        return;
      }

      // ⚠️ 병합/정합성 검토 필요 케이스: 같은 학번으로 여러 문서가 나오는 경우
      if (snap.size > 1) {
        const ids = snap.docs.map((d) => d.id).join(", ");
        setMsg(
          `⚠️ 같은 학번으로 users 문서가 ${snap.size}개 발견되었습니다. 관리자 검토 필요: ${ids}`
        );
        return;
      }

      const userDoc = snap.docs[0];
      const data = userDoc.data();
      const uid = userDoc.id;

      // ✅ whitelist/{studentId} 형태로 저장 (문서ID = 학번)
      await setDoc(doc(db, "whitelist", studentId.trim()), {
        studentId: studentId.trim(),
        name: name.trim(),
        uid,
        grade,
        class: classNum,
        number,
        email: data.email || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMsg(`화이트리스트 등록 완료! (${studentId} ${name} / uid: ${uid})`);
      setStudentId("");
      setName("");
    } catch (e) {
      console.error("[WHITELIST] register failed", e);
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminGuard>
      <Wrap>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>화이트리스트 등록</CardTitle>
            <CardDescription>
              학생이 <b>먼저 로그인</b>해서 users에 등록된 상태에서, 학번으로
              whitelist에 추가합니다.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Input
              placeholder="학번 5자리 (예: 10215)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              inputMode="numeric"
            />
            <Input
              placeholder="이름 (예: 홍길동) — 확인용"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Button className="w-full" onClick={register} disabled={busy}>
              {busy ? "등록 중..." : "화이트리스트 등록"}
            </Button>

            {msg && <Msg>{msg}</Msg>}
          </CardContent>
        </Card>
      </Wrap>
    </AdminGuard>
  );
}

const Wrap = styled.div`
  padding: 16px;
  display: flex;
  justify-content: center;
`;

const Msg = styled.p`
  font-size: 13px;
  color: rgba(0, 0, 0, 0.65);
  text-align: center;
`;
