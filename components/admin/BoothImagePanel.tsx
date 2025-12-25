"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { useAuth } from "@/contexts/auth-context";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ---------------- Types ---------------- */

type BoothLite = {
  id: string; // booths 문서(랜덤 id)
  boothIdx: number;
  name: string;
  location?: string;
  imageUrl?: string;
};

function isAdmin(email?: string | null) {
  // ✅ 운영자 계정만 넣기 (클라 가드)
  const admins = new Set(["admin@saerom.hs.kr", "2411129@saerom.hs.kr"]);
  return !!email && admins.has(email);
}

/* ---------------- ImgBB Upload ---------------- */

async function uploadToImgBB(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_IMGBB_API_KEY is missing");

  const formData = new FormData();
  // ImgBB는 "image" 필드에 파일/바이너리 넣으면 됨
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`ImgBB upload failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as any;

  // 보통 data.data.url 또는 data.data.display_url 사용 가능
  const url: string | undefined = data?.data?.url ?? data?.data?.display_url;
  if (!url) throw new Error("ImgBB response has no URL");

  return url;
}

/* ---------------- Image Compression (Canvas) ---------------- */

/**
 * 목표:
 * - 업로드 전에 대략 1~2MB로 줄이기
 * - 너무 큰 이미지면 가로/세로 maxWidth로 리사이즈 + JPEG 품질 낮추기
 *
 * 한계:
 * - 브라우저 캔버스는 EXIF 회전 정보가 무시될 수 있음(특정 폰에서 가끔 회전 문제)
 */
async function compressImage(
  file: File,
  opts?: {
    targetMaxBytes?: number; // 목표 바이트 (기본 1.7MB)
    maxWidth?: number; // 긴 변 기준 (기본 1600)
    maxIterations?: number; // 반복 횟수 (기본 8)
    initialQuality?: number; // 기본 0.85
    minQuality?: number; // 기본 0.5
  }
): Promise<File> {
  const targetMaxBytes = opts?.targetMaxBytes ?? Math.floor(1.7 * 1024 * 1024); // 1.7MB
  const maxWidth = opts?.maxWidth ?? 1600;
  const maxIterations = opts?.maxIterations ?? 8;
  const initialQuality = opts?.initialQuality ?? 0.85;
  const minQuality = opts?.minQuality ?? 0.5;

  // 이미 충분히 작으면 그대로
  if (file.size <= targetMaxBytes) return file;

  // 이미지 로드
  const img = await loadImageFromFile(file);

  // 캔버스 크기 계산 (긴 변을 maxWidth로 제한)
  const { width: srcW, height: srcH } = img;
  const scale = Math.min(1, maxWidth / Math.max(srcW, srcH));
  const dstW = Math.max(1, Math.round(srcW * scale));
  const dstH = Math.max(1, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = dstW;
  canvas.height = dstH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context is not available");

  ctx.drawImage(img, 0, 0, dstW, dstH);

  // 반복적으로 품질 낮춰 targetMaxBytes에 근접하게
  let quality = initialQuality;
  let bestBlob: Blob | null = null;

  for (let i = 0; i < maxIterations; i++) {
    const blob = await canvasToBlob(canvas, "image/jpeg", quality);

    bestBlob = blob;

    if (blob.size <= targetMaxBytes) break;

    // 목표 초과면 품질 낮추기
    const next = quality - 0.08;
    quality = Math.max(minQuality, next);
    if (quality === minQuality) break;
  }

  if (!bestBlob) return file;

  const compressedName = file.name.replace(/\.[^.]+$/, "") + "_compressed.jpg";
  return new File([bestBlob], compressedName, { type: "image/jpeg" });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error("canvas.toBlob returned null"));
        resolve(blob);
      },
      type,
      quality
    );
  });
}

/* ---------------- Page ---------------- */

export default function BoothImageUploadPage() {
  const { user, loading } = useAuth();

  const [booths, setBooths] = useState<BoothLite[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [detail, setDetail] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "booths"));
      const list = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((b) => Number.isFinite(Number(b.boothIdx)))
        .map((b) => ({
          id: b.id,
          boothIdx: Number(b.boothIdx),
          name: String(b.name ?? ""),
          location: b.location ? String(b.location) : "",
          imageUrl: b.imageUrl ? String(b.imageUrl) : "",
        }))
        .sort((a, b) => a.boothIdx - b.boothIdx);

      setBooths(list);

      // 첫 로드시 선택값이 없다면 첫 부스 자동 선택
      if (!selectedIdx && list.length > 0) {
        setSelectedIdx(String(list[0].boothIdx));
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = useMemo(() => {
    const idx = Number(selectedIdx);
    return booths.find((b) => b.boothIdx === idx) ?? null;
  }, [booths, selectedIdx]);

  const nextBoothIdx = useMemo(() => {
    if (!selected) return null;
    const i = booths.findIndex((b) => b.boothIdx === selected.boothIdx);
    if (i < 0) return null;
    return booths[i + 1]?.boothIdx ?? null;
  }, [booths, selected]);

  const clearFileInput = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const jumpToNextBooth = () => {
    if (nextBoothIdx == null) return;
    setSelectedIdx(String(nextBoothIdx));
    clearFileInput();
  };

  const upload = async () => {
    if (!selected) return setMsg("부스를 선택하세요.");
    if (!file) return setMsg("사진 파일을 선택하세요.");

    setBusy(true);
    setMsg("");
    setDetail("");

    try {
      // 1) 압축 (1~2MB 목표)
      const before = file.size;
      const compressed = await compressImage(file, {
        targetMaxBytes: Math.floor(1.7 * 1024 * 1024), // 1.7MB 목표
        maxWidth: 1600,
        initialQuality: 0.85,
        minQuality: 0.55,
      });
      const after = compressed.size;

      setDetail(
        `압축: ${(before / 1024 / 1024).toFixed(2)}MB → ${(
          after /
          1024 /
          1024
        ).toFixed(2)}MB`
      );

      // 2) ImgBB 업로드
      const url = await uploadToImgBB(compressed);

      // 3) Firestore imageUrl 업데이트
      await updateDoc(doc(db, "booths", selected.id), { imageUrl: url });

      // 4) 화면 즉시 반영 + 다음 부스 자동 선택
      setBooths((prev) =>
        prev.map((b) => (b.id === selected.id ? { ...b, imageUrl: url } : b))
      );

      setMsg(`완료! (${selected.boothIdx}. ${selected.name}) 이미지 등록됨`);
      jumpToNextBooth();
    } catch (e) {
      console.error("[BOOTH_IMAGE] upload failed", e);
      setMsg("업로드 실패");
      setDetail(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Wrap>로딩...</Wrap>;
  if (!user) return <Wrap>로그인이 필요합니다.</Wrap>;
  if (!isAdmin(user.email)) return <Wrap>접근 권한이 없습니다.</Wrap>;

  return (
    <Wrap>
      <Card>
        <CardHeader>
          <CardTitle>부스 사진 업로드 (ImgBB)</CardTitle>
        </CardHeader>

        <CardContent>
          <Field>
            <Label>부스 선택</Label>
            <Select
              value={selectedIdx}
              onChange={(e) => setSelectedIdx(e.target.value)}
            >
              {booths.length === 0 && <option value="">부스가 없습니다</option>}
              {booths.map((b) => (
                <option key={b.id} value={String(b.boothIdx)}>
                  {b.boothIdx}. {b.name} {b.location ? `(${b.location})` : ""}
                </option>
              ))}
            </Select>

            {selected && (
              <MiniRow>
                <MiniText>
                  현재:{" "}
                  <b>
                    {selected.boothIdx}. {selected.name}
                  </b>
                </MiniText>
                <MiniText>
                  다음:{" "}
                  <b>
                    {nextBoothIdx ? `${nextBoothIdx}번 부스` : "없음(마지막)"}
                  </b>
                </MiniText>
              </MiniRow>
            )}
          </Field>

          <Field>
            <Label>사진 선택(촬영)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Hint>휴대폰에서는 촬영 화면이 바로 열릴 수 있어요.</Hint>
          </Field>

          {selected?.imageUrl && (
            <Preview>
              <small>현재 등록된 이미지</small>
              <img src={selected.imageUrl} alt="booth" />
            </Preview>
          )}

          <BtnRow>
            <Button
              className="w-full"
              onClick={upload}
              disabled={busy || !selected || !file}
            >
              {busy ? "업로드 중..." : "업로드 & imageUrl 반영"}
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={jumpToNextBooth}
              disabled={busy || nextBoothIdx == null}
            >
              다음 부스로 이동
            </Button>
          </BtnRow>

          {msg && <Msg>{msg}</Msg>}
          {detail && <Detail>{detail}</Detail>}
        </CardContent>
      </Card>
    </Wrap>
  );
}

/* ---------------- styled-components ---------------- */

const Wrap = styled.div`
  padding: 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
`;

const Label = styled.div`
  font-size: 14px;
  font-weight: 800;
`;

const Select = styled.select`
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0 12px;
  background: white;
`;

const Hint = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
`;

const MiniRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 6px;
`;

const MiniText = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
`;

const BtnRow = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 8px;
`;

const Preview = styled.div`
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  img {
    width: 100%;
    max-height: 260px;
    object-fit: cover;
    border-radius: 14px;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }
`;

const Msg = styled.div`
  margin-top: 12px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.75);
  background: rgba(0, 0, 0, 0.04);
  padding: 10px 12px;
  border-radius: 10px;
`;

const Detail = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  background: rgba(0, 0, 0, 0.03);
  padding: 10px 12px;
  border-radius: 10px;
`;
