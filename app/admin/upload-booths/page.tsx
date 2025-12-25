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
    name: "초코민토 요리모 쿠키토 아이스크리무!",
    location: "117 미술실",
    floor: 1,
    description: "아이스크림, 초코펜, 쿠키 등으로 나만의 간식 만들기 체험",
    category: ["음식", "체험", "예술"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 4,
    name: "미美향랜드(테크웍스)",
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

  // 2F
  {
    boothIdx: 6,
    name: "수리 논술/수학 미술 부스",
    location: "1-1",
    floor: 2,
    description:
      "수학과목에 대한 흥미 up 수학문제 맞히기, 알지오메스를 활용해 그래프 그림 그리기 활동",
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
    description:
      "CPR 체험, 시뮬레이션 기반의 음주(고글), 흡연(폐활량) 체험을 챌린지 형태로 운영",
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
    description:
      "통계적 사고를 기반으로 로또 당첨 확률을 계산, 로또 당첨 프로그램 운영",
    category: ["수학", "퀴즈", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 9,
    name: "미美향랜드",
    location: "1-4",
    floor: 2,
    description: "마일리지 시스템 운영, 활동 성과&결과물 전시",
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
    description:
      "진로 체험을 기획하여 노동자에 대한 이해, 공감을 바탕으로 한 게임 프로그램",
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
    description: "식품 안전 퀴즈 프로그램 & 떡볶이 제공",
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
    description:
      "개발한 게임 구현 방식 소개, 직접 게임에 참여할 수 있는 프로그램",
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
    description: "자동차 운전 시연, 키트 만들기 체험, 퀴즈 프로그램",
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
    description: "슬라임 체험, 슬라임 화분 만들기 프로그램",
    category: ["예술", "체험", "힐링"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },

  // 3F (과학부스 포스터) - 기존
  {
    boothIdx: 15,
    name: "요아존",
    location: "301 지구과학실",
    floor: 3,
    description:
      "과학 실험, 퀴즈 프로그램 후, 나만의 요거트 아이스크림 만들기 체험",
    category: ["과학", "체험", "음식"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 16,
    name: "뉴턴이 맞은 사과",
    location: "302 물리실험실",
    floor: 3,
    description:
      "라이덴병 실험 체험, 물리 실험 내용 기반의 퀴즈, 실험 원리&법칙 시각화 자료 전시",
    category: ["과학", "퀴즈", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 17,
    name: "서킷 트레이닝 체험",
    location: "310 체력단련실",
    floor: 3,
    description:
      "정해진 시간 동안 5개의 운동 기구를 체험 미션을 수행하는 프로그램",
    category: ["건강", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 18,
    name: "음악실기반",
    location: "311 음악실",
    floor: 3,
    description:
      "다양한 장르의 음악 감상, 소통, 합주공연을 즐길 수 있는 프로그램",
    category: ["예술", "힐링", "미디어"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 19,
    name: "오버하지마2",
    location: "312 체육관",
    floor: 3,
    description: "학생 건강, 체력 증진을 위한 체력장 프로그램",
    category: ["건강", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 20,
    name: "이 부스 터질지도",
    location: "314 화학실험실",
    floor: 3,
    description: "타로로 만드는 향수, 슬라임 카페 운영으로 화학 원리 체험",
    category: ["과학", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 21,
    name: "사이언스 팩토리",
    location: "316 생명과학실",
    floor: 3,
    description:
      "물벼룩 이야기, 살아있는 환경 실험실 등 실험 과정 & 결과물 전시, 세포 컵케이크 만들기 체험",
    category: ["과학", "전시", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },

  // 4F (포스터 2장) - 기존
  {
    boothIdx: 22,
    name: "새롬 약국",
    location: "2-1",
    floor: 4,
    description: "응급 처치 체험 및 퀴즈 프로그램",
    category: ["건강", "체험", "진로"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 23,
    name: "수학의 아름다움",
    location: "2-2",
    floor: 4,
    description:
      "수학난제, 스테인드글라스 전시, 몬티홀, 동전 던지기 프로그램 운영",
    category: ["수학", "전시", "퀴즈"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 24,
    name: "탱달연구소",
    location: "2-5",
    floor: 4,
    description:
      "비가역적 화학반응, 교차 결합 현상의 원리를 바탕으로 달고나, 탱탱볼 체험",
    category: ["과학", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 25,
    name: "막장토론퀴즈",
    location: "2-6",
    floor: 4,
    description: "넌센스, 상식퀴즈, 토론 프로그램",
    category: ["인문사회", "퀴즈", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 26,
    name: "밸런스팝업",
    location: "2-7",
    floor: 4,
    description: "은둔 청소년 고립 예방, 디지털 디톡스 체험 프로그램",
    category: ["힐링", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 27,
    name: "모의주식투자",
    location: "2-8",
    floor: 4,
    description:
      "경제, 경영 원리 체험을 위한 모의 주식 투자, 리사이클링 병뚜껑 키링 만들기 프로그램",
    category: ["인문사회", "진로", "체험"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 28,
    name: "오아시스",
    location: "2-9",
    floor: 4,
    description: "영화, 음악을 제공하는 힐링 카페 운영",
    category: ["힐링", "미디어"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 29,
    name: "마음약국",
    location: "학생안전부 앞 / 자율학습 교육공간",
    floor: 4,
    description:
      "스트레스 유형에 맞는 특별선물 처방 및 힐링 모루 인형 키링 만들기",
    category: ["힐링", "체험", "건강"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 30,
    name: "세팍타크로 만들기",
    location: "2-10",
    floor: 4,
    description:
      "수학 창의력 증진을 목적으로 세팍타크로 열쇠고리를 제작, 완성하는 프로그램",
    category: ["수학", "체험", "참여형"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 31,
    name: "독서퀴즈 방탈출",
    location: "2-11",
    floor: 4,
    description:
      "도서의 줄거리를 파악하고 문제 풀이를 하며 다양한 분야의 도서를 접할 수 있는 프로그램",
    category: ["인문사회", "퀴즈", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 32,
    name: "영어동아리를 이겨라",
    location: "2-12",
    floor: 4,
    description: "영어 퀴즈 프로그램 운영",
    category: ["인문사회", "퀴즈", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 33,
    name: "느좋남녀들의 영화상영회",
    location: "2-13",
    floor: 4,
    description: "영화 감상 후, 제작한 포스터 전시 및 영화 상영(팝콘제공)",
    category: ["미디어", "전시", "힐링"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 34,
    name: "내가 그 광고를 모를까",
    location: "414 음악실",
    floor: 4,
    description: "CM송, 광고영상 클립을 주제로 퀴즈 프로그램",
    category: ["미디어", "퀴즈", "게임"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 35,
    name: "9와 4/3승강장에서 만나는 예술동아리",
    location: "417 수학교과실",
    floor: 4,
    description: "해리포터 컨셉의 카페, 포토부스 운영",
    category: ["예술", "체험", "힐링"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },

  // ✅✅✅ 3F (누락된 포스터 7개) - 추가 (36~42)
  {
    boothIdx: 36,
    name: "기자가 된 수의 라면 푸드트럭",
    location: "1-5",
    floor: 3,
    description: "라면 선호도, 섭취 빈도수 설문조사 실시, 기사 작성 후 배포",
    category: ["인문사회", "설문", "미디어"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 37,
    name: "책으로 여는 미래",
    location: "1-6",
    floor: 3,
    description: "다양한 진로 분야와 관련된 도서를 추천, 소개",
    category: ["진로", "인문사회", "전시"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 38,
    name: "우리의도시",
    location: "1-7",
    floor: 3,
    description: "세종시 답사, 탐구 결과 공유, 전시",
    category: ["인문사회", "탐구", "전시"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 39,
    name: "요아정 먹고싶정",
    location: "1-8",
    floor: 3,
    description:
      "공동체 의식 함양을 위해 전통 놀이 진행, 놀이별 제공되는 토핑과 요거트 아이스크림 증정",
    category: ["체험", "게임", "음식"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 40,
    name: "병속에 지구를 넣어봤어",
    location: "1-9",
    floor: 3,
    description: "화산석 이끼, 제올라이트, 피규어 장식으로 나만의 생태계 제작",
    category: ["과학", "체험", "힐링"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 41,
    name: "전략과협상",
    location: "1-10",
    floor: 3,
    description: "다양한 보드게임을 진행하며 플레이상 전술, 전략 나눔 활동",
    category: ["게임", "보드게임", "전략"],
    visitCount: 0,
    imageUrl: "",
    quiz: { question: "", options: [], correctAnswer: -1 },
  },
  {
    boothIdx: 42,
    name: "브랜드 한 젓가락",
    location: "1-11",
    floor: 3,
    description:
      "라면 상표 리메이크하여 제작, 광고 보고 주제 맞히기, 인스타에 홍보",
    category: ["미디어", "퀴즈", "홍보"],
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
