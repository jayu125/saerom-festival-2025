"use client";

import { Button } from "@/components/ui/button";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

const booths = [
  {
    boothIdx: 1,
    name: "혼",
    location: "106 방송실",
    floor: 1,
    description: "컨셉 사진 촬영, 공포 체험 방탈출 프로그램",
    category: ["체험", "게임", "미디어"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 2,
    name: "편지 먹는 붕어빵",
    location: "116 도서실",
    floor: 1,
    description: "책 속 문장을 주제로 뽑기 이벤트, 편지쓰기 활동&전달 프로그램",
    category: ["인문사회", "참여형", "힐링"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 3,
    name: "초코민트 요리모 쿠키토 아이스크리무!",
    location: "117 미술실",
    floor: 1,
    description: "아이스크림, 초코민, 쿠키 등으로 나만의 간식 만들기 체험",
    category: ["음식", "체험", "예술"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 4,
    name: "미향랜드(테크윅스)",
    location: "1층 중앙홀",
    floor: 1,
    description: "마일리지 선물 교환소",
    category: ["참여형", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 5,
    name: "시네마 퀘스트",
    location: "시청각실",
    floor: 1,
    description:
      "영화 포스터 제목 맞히기, 제비뽑기, 영화 줄거리 예측 퀴즈, 영화 OST 등 영화 감상 문화 프로그램",
    category: ["미디어", "퀴즈", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },

  {
    boothIdx: 6,
    name: "수리 논술 / 수학 미술 부스",
    location: "1-1",
    floor: 2,
    description: "수학문제 맞히기, 알지오매스로 그래프 그림 그리기 활동",
    category: ["수학", "체험", "예술"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 7,
    name: "새롬종합병원",
    location: "1-2",
    floor: 2,
    description: "CPR, 음주·흡연 시뮬레이션 체험",
    category: ["건강", "체험", "진로"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 8,
    name: "통계동아리",
    location: "1-3",
    floor: 2,
    description: "로또 확률 계산 및 통계 기반 게임",
    category: ["수학", "퀴즈", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 9,
    name: "미향랜드",
    location: "1-4",
    floor: 2,
    description: "마일리지 시스템 운영 및 전시",
    category: ["참여형", "전시"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },

  {
    boothIdx: 10,
    name: "짐꾼체험",
    location: "207 진로실",
    floor: 2,
    description: "노동 체험 기반 진로 게임",
    category: ["진로", "체험", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 11,
    name: "떡볶이 연구소",
    location: "210 가사실",
    floor: 2,
    description: "식품 안전 퀴즈와 떡볶이 체험",
    category: ["음식", "퀴즈", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 12,
    name: "한판만 더",
    location: "212 컴퓨터실",
    floor: 2,
    description: "자체 개발 게임 체험",
    category: ["게임", "체험", "미디어"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 13,
    name: "부릉부릉부스",
    location: "215 기술실",
    floor: 2,
    description: "자동차 운전 시연 및 키트 만들기",
    category: ["과학", "체험", "진로"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 14,
    name: "몽실화분",
    location: "216 미술실",
    floor: 2,
    description: "슬라임 화분 만들기",
    category: ["예술", "체험", "힐링"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },

  {
    boothIdx: 15,
    name: "기자가 된 수의 라면 푸드트럭",
    location: "1-5",
    floor: 3,
    description: "라면 설문조사 및 기사 작성",
    category: ["인문사회", "음식", "참여형"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 16,
    name: "책으로 여는 미래",
    location: "1-6",
    floor: 3,
    description: "진로 도서 추천",
    category: ["진로", "인문사회", "전시"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 17,
    name: "우리의도시",
    location: "1-7",
    floor: 3,
    description: "세종시 탐구 전시",
    category: ["인문사회", "전시", "환경"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 18,
    name: "요망정 먹고싶정",
    location: "1-8",
    floor: 3,
    description: "전통 놀이와 요거트 아이스크림",
    category: ["게임", "음식", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 19,
    name: "병속에 지구를 넣어봤어",
    location: "1-9",
    floor: 3,
    description: "병 속 생태계 만들기",
    category: ["환경", "과학", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 20,
    name: "전략과협상",
    location: "1-10",
    floor: 3,
    description: "보드게임 기반 전략 활동",
    category: ["게임", "인문사회", "참여형"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },

  {
    boothIdx: 21,
    name: "브랜드 한 젓가락",
    location: "1-11",
    floor: 3,
    description: "라면 브랜드 리메이크",
    category: ["미디어", "인문사회", "참여형"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 22,
    name: "요아존",
    location: "301 지구과학실",
    floor: 3,
    description: "과학 실험과 요거트 체험",
    category: ["과학", "체험", "음식"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 23,
    name: "뉴턴이 맞은 사과",
    location: "302 물리실험실",
    floor: 3,
    description: "물리 실험과 퀴즈",
    category: ["과학", "퀴즈", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 24,
    name: "서킷 트레이닝 체험",
    location: "310 체력단련실",
    floor: 3,
    description: "운동 미션 체험",
    category: ["건강", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 25,
    name: "음악실기반",
    location: "311 음악실",
    floor: 3,
    description: "음악 감상과 공연",
    category: ["예술", "힐링", "미디어"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },

  {
    boothIdx: 26,
    name: "오버하지마2",
    location: "312 체육관",
    floor: 3,
    description: "체력장 프로그램",
    category: ["건강", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 27,
    name: "이 부스 터질지도",
    location: "314 화학실험실",
    floor: 3,
    description: "화학 체험 슬라임·향수",
    category: ["과학", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 28,
    name: "사이언스 팩토리",
    location: "316 생명과학실",
    floor: 3,
    description: "생명과학 전시 및 체험",
    category: ["과학", "전시", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 29,
    name: "새롬 약국",
    location: "2-1",
    floor: 4,
    description: "응급 처치 체험",
    category: ["건강", "체험", "진로"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 30,
    name: "수학의 아름다움",
    location: "2-2",
    floor: 4,
    description: "수학 전시 및 확률 실험",
    category: ["수학", "전시", "퀴즈"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },

  {
    boothIdx: 31,
    name: "탱탱연구소",
    location: "2-5",
    floor: 4,
    description: "화학 반응 체험",
    category: ["과학", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 32,
    name: "막장토론퀴즈",
    location: "2-6",
    floor: 4,
    description: "토론과 퀴즈",
    category: ["인문사회", "퀴즈", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 33,
    name: "밸런스팡법",
    location: "2-7",
    floor: 4,
    description: "디지털 디톡스 체험",
    category: ["힐링", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 34,
    name: "모의주식투자",
    location: "2-8",
    floor: 4,
    description: "주식 투자 체험",
    category: ["인문사회", "진로", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 35,
    name: "오아시스",
    location: "2-9",
    floor: 4,
    description: "영화·음악 힐링 카페",
    category: ["힐링", "미디어"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
];

export async function uploadBoothsToFirestore() {
  console.log("🚀 Booth upload started");

  const boothCollection = collection(db, "booths");

  for (const booth of booths) {
    try {
      // ✅ boothIdx 중복 체크 (이미 있으면 skip)
      const q = query(boothCollection, where("boothIdx", "==", booth.boothIdx));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        console.warn(`⚠️ boothIdx=${booth.boothIdx} already exists. Skipping.`);
        continue;
      }

      await addDoc(boothCollection, {
        ...booth,
        createdAt: new Date(),
      });

      console.log(`✅ boothIdx=${booth.boothIdx} uploaded`);
    } catch (err) {
      console.error(`❌ Failed to upload boothIdx=${booth.boothIdx}`, err);
    }
  }

  console.log("🎉 Booth upload finished");
}

export default function BoothUploadPage() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Booths Firestore Upload</h1>
      <Button onClick={uploadBoothsToFirestore}>Firestore에 부스 업로드</Button>
    </div>
  );
}
