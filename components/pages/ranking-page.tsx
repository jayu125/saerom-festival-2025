"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Trophy, Medal } from "lucide-react";

interface ClassRanking {
  grade: number;
  classNum: number;
  totalMileage: number;
  memberCount: number;
  avgMileage: number;
}

export function RankingPage() {
  const [rankings, setRankings] = useState<ClassRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const classMap = new Map<string, { total: number; count: number }>();

        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          const key = `${data.grade}-${data.class}`;
          const existing = classMap.get(key) || { total: 0, count: 0 };
          classMap.set(key, {
            total: existing.total + (data.baseMileage || 0),
            count: existing.count + 1,
          });
        });

        const rankingsData: ClassRanking[] = [];
        classMap.forEach((value, key) => {
          const [grade, classNum] = key.split("-").map(Number);
          rankingsData.push({
            grade,
            classNum,
            totalMileage: value.total,
            memberCount: value.count,
            avgMileage: value.count > 0 ? value.total / value.count : 0,
          });
        });

        // Sort: by avgMileage desc, then grade asc, then classNum asc
        rankingsData.sort((a, b) => {
          if (a.avgMileage !== b.avgMileage) {
            return b.avgMileage - a.avgMileage;
          }
          if (a.grade !== b.grade) {
            return a.grade - b.grade;
          }
          return a.classNum - b.classNum;
        });

        setRankings(rankingsData);
      } catch (error) {
        console.error("순위 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  if (loading) {
    return (
      <LoaderWrap>
        <Loader2 />
      </LoaderWrap>
    );
  }

  return (
    <Page>
      <Header>
        <Title>반별 순위</Title>
        <Subtitle>인당 평균 마일리지 기준</Subtitle>
      </Header>

      <RankingList>
        {rankings.map((item, index) => {
          const rank = index + 1;
          return (
            <RankCard key={`${item.grade}-${item.classNum}`} $rank={rank}>
              <RankBadge $rank={rank}>
                {rank <= 3 ? (
                  rank === 1 ? (
                    <Trophy size={20} />
                  ) : (
                    <Medal size={20} />
                  )
                ) : (
                  <span>{rank}</span>
                )}
              </RankBadge>
              <ClassInfo>
                <ClassName>
                  {item.grade}학년 {item.classNum}반
                </ClassName>
                <ClassStats>
                  {item.memberCount}명 · 총 {item.totalMileage.toLocaleString()}{" "}
                  M
                </ClassStats>
              </ClassInfo>
              <AvgMileage $rank={rank}>
                {Math.round(item.avgMileage).toLocaleString()} M
              </AvgMileage>
            </RankCard>
          );
        })}
      </RankingList>
    </Page>
  );
}

const Page = styled.div`
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.3);
`;

const LoaderWrap = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 1.5rem;
    height: 1.5rem;
    color: hsl(var(--primary));
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const RankingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const RankCard = styled.div<{ $rank: number }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: ${({ $rank }) =>
    $rank === 1
      ? "#FFF9E6"
      : $rank === 2
      ? "#F5F5F5"
      : $rank === 3
      ? "#FFF5F0"
      : "white"};
  border: 2px solid ${({ $rank }) => ($rank <= 3 ? "#FFD700" : "#e5e5e5")};
  border-radius: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const RankBadge = styled.div<{ $rank: number }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.125rem;
  background: ${({ $rank }) =>
    $rank === 1
      ? "#FFD700"
      : $rank === 2
      ? "#C0C0C0"
      : $rank === 3
      ? "#CD7F32"
      : "#e5e5e5"};
  color: ${({ $rank }) => ($rank <= 3 ? "white" : "#666")};
  flex-shrink: 0;
`;

const ClassInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ClassName = styled.div`
  font-size: 1.125rem;
  font-weight: 700;
`;

const ClassStats = styled.div`
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.5);
`;

const AvgMileage = styled.div<{ $rank: number }>`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${({ $rank }) => ($rank <= 3 ? "#000" : "#333")};
  flex-shrink: 0;
`;
