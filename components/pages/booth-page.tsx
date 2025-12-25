"use client";

import { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { useAuth } from "@/contexts/auth-context";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Booth } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Check, HelpCircle, Loader2, Users } from "lucide-react";
import { QuizDialog } from "@/components/quiz-dialog";
import { BoothCardComponent } from "../ui/boothCard";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export function BoothPage() {
  const { userProfile } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [visitedBooths, setVisitedBooths] = useState<Set<string>>(new Set());
  const [quizCompleted, setQuizCompleted] = useState<Set<string>>(new Set());
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [activeFloor, setActiveFloor] = useState<string>("all");
  // crossfade용
  const [displayMode, setDisplayMode] = useState<"list" | "map">("list"); // 실제로 보여주는 모드
  const [isFading, setIsFading] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string>("");
  const [zoomTitle, setZoomTitle] = useState<string>("");
  const [zoomFloor, setZoomFloor] = useState<string>("1");
  const [zoomIndex, setZoomIndex] = useState<number>(0);

  const openZoom = (floor: string, index = 0) => {
    if (!FLOOR_MAPS[floor]) return;
    setZoomFloor(floor);
    setZoomIndex(index);
    setZoomOpen(true);
  };

  const FLOOR_MAPS: Record<
    string,
    { label: string; images: { src: string; title?: string }[] }
  > = {
    "1": { label: "1층", images: [{ src: "/maps/4.png" }] },
    "2": { label: "2층", images: [{ src: "/maps/5.png" }] },
    "3": {
      label: "3층",
      images: [{ src: "/maps/6.png" }, { src: "/maps/7.png" }],
    },
    "4": {
      label: "4층",
      images: [{ src: "/maps/8.png" }, { src: "/maps/9.png" }],
    },
  };

  const switchView = (next: "list" | "map") => {
    if (next === viewMode) return;

    // 들어오는 뷰를 미리 올려두고
    setDisplayMode(next);
    // 페이드 시작
    setIsFading(true);
    if (displayMode === "map") {
      setActiveFloor("all");
    } else {
      setActiveFloor("1");
    }

    // 애니메이션 끝나면 최종 모드 확정 + 페이드 종료
    window.setTimeout(() => {
      setViewMode(next);

      setIsFading(false);
    }, 220); // 아래 CSS duration과 맞추기
  };

  const floors =
    booths.length > 0
      ? ["all", ...Array.from(new Set(booths.map((b) => b.floor))).sort()]
      : ["all"];

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;

      try {
        const boothsQuery = query(
          collection(db, "booths"),
          orderBy("visitCount", "desc")
        );
        const boothsSnapshot = await getDocs(boothsQuery);
        const boothsData: Booth[] = [];
        boothsSnapshot.forEach((doc) => {
          boothsData.push({
            id: doc.id,
            ...doc.data(),
          } as Booth);
        });
        setBooths(boothsData);

        const visitsSnapshot = await getDocs(
          collection(db, "users", userProfile.uid, "boothVisits")
        );
        const visited = new Set<string>();
        visitsSnapshot.forEach((doc) => {
          visited.add(doc.id);
        });
        setVisitedBooths(visited);

        const quizSnapshot = await getDocs(
          collection(db, "users", userProfile.uid, "quizRewards")
        );
        const completed = new Set<string>();
        quizSnapshot.forEach((doc) => {
          completed.add(doc.id);
        });
        setQuizCompleted(completed);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile]);

  const handleQuizClick = (booth: Booth) => {
    setSelectedBooth(booth);
    setIsQuizOpen(true);
  };

  const handleQuizComplete = (boothId: string) => {
    setQuizCompleted((prev) => new Set([...prev, boothId]));
  };

  if (loading) {
    return (
      <LoaderWrap>
        <Loader2 />
      </LoaderWrap>
    );
  }

  if (booths.length === 0) {
    return (
      <Page>
        <EmptyTitle>부스 안내</EmptyTitle>
        <EmptyDesc>아직 등록된 부스가 없습니다.</EmptyDesc>
      </Page>
    );
  }

  return (
    <Page>
      <Header>
        <Title>부스</Title>
        <Subtitle>층별 부스를 확인하고 NFC로 방문하세요</Subtitle>
      </Header>

      <Tabs
        value={activeFloor}
        onValueChange={setActiveFloor}
        className="w-full"
      >
        <StyledTabsList $map={displayMode === "map"}>
          {displayMode !== "map" && <TabsTrigger value="all">ALL</TabsTrigger>}
          <TabsTrigger value="1">1F</TabsTrigger>
          <TabsTrigger value="2">2F</TabsTrigger>
          <TabsTrigger value="3">3F</TabsTrigger>
          <TabsTrigger value="4">4F</TabsTrigger>
        </StyledTabsList>

        <CrossfadeContainer>
          {/* LIST LAYER */}
          <CrossfadeLayer
            $visible={displayMode === "list"}
            $active={viewMode === "list"}
            $isFading={isFading}
            $scroll
          >
            {/* ✅ 기존 리스트 렌더링을 그대로 넣기 */}
            <ListView>
              <StyledTabsContent value="all">
                {booths.map((booth) => {
                  const isVisited = visitedBooths.has(
                    booth.boothIdx.toString()
                  );
                  const isQuizDone = quizCompleted.has(
                    booth.boothIdx.toString()
                  );

                  return (
                    <BoothCardComponent
                      key={booth.id}
                      states={{ isVisited, isQuizDone }}
                      functions={{ cl: handleQuizClick }}
                      boothInfo={booth}
                    />
                  );
                })}
              </StyledTabsContent>

              {[1, 2, 3, 4].map((floor) => (
                <StyledTabsContent key={floor} value={floor.toString()}>
                  {booths
                    .filter((booth) => booth.floor === floor)
                    .map((booth) => {
                      const isVisited = visitedBooths.has(
                        booth.boothIdx.toString()
                      );
                      const isQuizDone = quizCompleted.has(
                        booth.boothIdx.toString()
                      );

                      return (
                        <BoothCardComponent
                          key={booth.id}
                          states={{ isVisited, isQuizDone }}
                          functions={{ cl: handleQuizClick }}
                          boothInfo={booth}
                        />
                      );
                    })}
                </StyledTabsContent>
              ))}
              <Empty />
            </ListView>
          </CrossfadeLayer>

          {/* MAP LAYER */}
          <CrossfadeLayer
            $visible={displayMode === "map"}
            $active={viewMode === "map"}
            $isFading={isFading}
          >
            {/* ✅ 맵 뷰 */}
            <MapContainer>
              {activeFloor === "all" ? (
                <MapGrid>
                  {(["1", "2", "3", "4"] as const).map((f) => (
                    <MapThumb key={f} onClick={() => openZoom(f, 0)}>
                      <MapThumbTitle>{FLOOR_MAPS[f].label}</MapThumbTitle>
                      <MapImg
                        src={FLOOR_MAPS[f].images[0].src}
                        alt={`${FLOOR_MAPS[f].label} 지도`}
                      />
                      <MapThumbHint>
                        탭해서 확대{" "}
                        {FLOOR_MAPS[f].images.length > 1 ? "(2장)" : ""}
                      </MapThumbHint>
                    </MapThumb>
                  ))}
                </MapGrid>
              ) : (
                <MapSingleWrap>
                  <MapSingleTitle>
                    {FLOOR_MAPS[activeFloor]?.label} 지도
                  </MapSingleTitle>

                  <MapMulti>
                    {FLOOR_MAPS[activeFloor]?.images.map((img, idx) => (
                      <MapSingle
                        key={img.src}
                        onClick={() => openZoom(activeFloor, idx)}
                      >
                        <MapImg
                          src={img.src}
                          alt={`${activeFloor}층 지도 ${idx + 1}`}
                        />
                        <MapSingleHint>
                          탭해서 상세 보기 ({idx + 1}/
                          {FLOOR_MAPS[activeFloor].images.length})
                        </MapSingleHint>
                      </MapSingle>
                    ))}
                  </MapMulti>
                </MapSingleWrap>
              )}
            </MapContainer>
          </CrossfadeLayer>
        </CrossfadeContainer>
      </Tabs>

      {selectedBooth && (
        <QuizDialog
          open={isQuizOpen}
          onOpenChange={setIsQuizOpen}
          booth={selectedBooth}
          onComplete={(boothKey) => handleQuizComplete(boothKey)} // ✅ boothIdx string
        />
      )}

      <ViewSelector>
        <SelectorButton
          $active={displayMode === "list"}
          onClick={() => switchView("list")}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="white"
          >
            <path
              d="M4.66663 8H19.3333"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M25.3334 10C26.4379 10 27.3334 9.10457 27.3334 8C27.3334 6.89543 26.4379 6 25.3334 6C24.2288 6 23.3334 6.89543 23.3334 8C23.3334 9.10457 24.2288 10 25.3334 10Z"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M27.3333 16H12.6666"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6.66663 18C7.7712 18 8.66663 17.1046 8.66663 16C8.66663 14.8954 7.7712 14 6.66663 14C5.56206 14 4.66663 14.8954 4.66663 16C4.66663 17.1046 5.56206 18 6.66663 18Z"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4.66663 24H19.3333"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M25.3334 26C26.4379 26 27.3334 25.1046 27.3334 24C27.3334 22.8954 26.4379 22 25.3334 22C24.2288 22 23.3334 22.8954 23.3334 24C23.3334 25.1046 24.2288 26 25.3334 26Z"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </SelectorButton>
        <SelectorButton
          $active={viewMode === "map"}
          onClick={() => switchView("map")}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            stroke="white"
          >
            <path
              d="M4.59997 10.9333L11.2666 6.49334C11.4843 6.34997 11.7393 6.27356 12 6.27356C12.2606 6.27356 12.5156 6.34997 12.7333 6.49334L19.2666 10.84C19.4843 10.9834 19.7393 11.0598 20 11.0598C20.2606 11.0598 20.5156 10.9834 20.7333 10.84L25.9333 7.38667C26.1338 7.25461 26.3663 7.17914 26.6062 7.16825C26.846 7.15736 27.0844 7.21145 27.2961 7.3248C27.5078 7.43814 27.6849 7.60655 27.8088 7.81223C27.9327 8.01791 27.9987 8.25323 28 8.49334V20C28.001 20.2219 27.9467 20.4405 27.842 20.6361C27.7372 20.8316 27.5853 20.998 27.4 21.12L20.7333 25.56C20.5156 25.7034 20.2606 25.7798 20 25.7798C19.7393 25.7798 19.4843 25.7034 19.2666 25.56L12.7333 21.2133C12.5156 21.07 12.2606 20.9936 12 20.9936C11.7393 20.9936 11.4843 21.07 11.2666 21.2133L6.06664 24.6667C5.86232 24.8014 5.62484 24.8774 5.38023 24.8861C5.13562 24.8949 4.89331 24.8362 4.67987 24.7164C4.46642 24.5966 4.29007 24.4203 4.17015 24.2069C4.05022 23.9936 3.99135 23.7513 3.99997 23.5067V12C4.00755 11.7872 4.06598 11.5793 4.17036 11.3938C4.27475 11.2082 4.42206 11.0503 4.59997 10.9333Z"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 6.26672V20.9334"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.8 11.2V25.8666"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </SelectorButton>
      </ViewSelector>
      {zoomOpen &&
        (() => {
          const imgs = FLOOR_MAPS[zoomFloor]?.images ?? [];
          const current = imgs[zoomIndex];
          const canPrev = zoomIndex > 0;
          const canNext = zoomIndex < imgs.length - 1;

          return (
            <ZoomOverlay onClick={() => setZoomOpen(false)}>
              <ZoomSheet onClick={(e) => e.stopPropagation()}>
                <ZoomHeader>
                  <ZoomTitle>
                    {FLOOR_MAPS[zoomFloor]?.label} 지도 ({zoomIndex + 1}/
                    {imgs.length})
                  </ZoomTitle>

                  <ZoomHeaderRight>
                    <ZoomNavBtn
                      disabled={!canPrev}
                      onClick={() => canPrev && setZoomIndex((v) => v - 1)}
                    >
                      이전
                    </ZoomNavBtn>
                    <ZoomNavBtn
                      disabled={!canNext}
                      onClick={() => canNext && setZoomIndex((v) => v + 1)}
                    >
                      다음
                    </ZoomNavBtn>
                    <ZoomClose onClick={() => setZoomOpen(false)}>
                      닫기
                    </ZoomClose>
                  </ZoomHeaderRight>
                </ZoomHeader>

                <ZoomBody>
                  {current ? (
                    <TransformWrapper
                      initialScale={1}
                      minScale={1}
                      maxScale={4}
                      centerOnInit
                      doubleClick={{ disabled: false, step: 1 }}
                      pinch={{ step: 5 }} // 핀치 반응
                      wheel={{ disabled: true }} // 모바일/터치 위주면 wheel은 꺼도 됨
                      panning={{ velocityDisabled: true }}
                    >
                      {({ zoomIn, zoomOut, resetTransform }) => (
                        <>
                          <ZoomToolbar>
                            <ZoomToolBtn onClick={() => zoomOut()}>
                              -
                            </ZoomToolBtn>
                            <ZoomToolBtn onClick={() => resetTransform()}>
                              원복
                            </ZoomToolBtn>
                            <ZoomToolBtn onClick={() => zoomIn()}>
                              +
                            </ZoomToolBtn>
                          </ZoomToolbar>

                          <TransformComponent
                            wrapperStyle={{ width: "100%", height: "100%" }}
                            contentStyle={{ width: "100%", height: "auto" }}
                          >
                            <ZoomImage src={current.src} alt="층 지도 확대" />
                          </TransformComponent>
                        </>
                      )}
                    </TransformWrapper>
                  ) : (
                    <div>이미지를 불러올 수 없습니다.</div>
                  )}
                </ZoomBody>
              </ZoomSheet>
            </ZoomOverlay>
          );
        })()}
    </Page>
  );
}

/* styled-components */

const Page = styled.div`
  padding: 1.5rem 0rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100dvh; /* ✅ 모바일 주소창 변화 대응 */
  overflow: hidden; /* ✅ 페이지 자체 스크롤 금지 */
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0rem 1rem;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
`;

const Empty = styled.div`
  margin-bottom: 50px;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  font-weight: 700;
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

const EmptyTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const EmptyDesc = styled.p`
  color: hsl(var(--muted-foreground));
`;

const mapMode = css`
  /* width: 50px;
  height: 300px;
  display: grid;
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 20px;

  position: sticky;
  top: 0;
  z-index: 10;

  background: black;

  position: fixed;
  transform: translateY(-50%);
  left: 16px;
  top: 50%;
  border-radius: 10px; */
  width: 100%;
  height: 45px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  position: sticky;
  top: 0;
  z-index: 10;

  background: "#f1f1f1";
`;

const listViewMode = css`
  width: 100%;
  height: 45px;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));

  position: sticky;
  top: 0;
  z-index: 10;

  background: "#f1f1f1";
`;

const StyledTabsList = styled(TabsList)<{ $map: boolean }>`
  ${({ $map }) => ($map ? mapMode : listViewMode)};
`;

const StyledTabsContent = styled(TabsContent)`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background-color: #f1f1f1;
  /* margin-left: 50px; */
`;

const MapContainer = styled.div`
  margin-top: 1rem;
  width: 100%;
  background-color: #f1f1f1;
  padding: 12px;
`;

const MapPlaceholder = styled.div`
  width: 90%;
  height: 90%;
  border-radius: 12px;
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.4);
`;

const ViewSelector = styled.div`
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  background: white;
  border-radius: 32px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 49;
  width: 120px;
  height: 60px;
`;

const SelectorButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 10px;
  background: black;
  color: ${({ $active }) => ($active ? "white" : "#555")};
  border: none;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
  box-sizing: border-box;

  & svg {
    padding: 4px;
    width: 100%;
    height: 100%;
    background-color: ${({ $active }) => ($active ? "white" : "black")};
    border-radius: 50%;
    stroke: ${({ $active }) => ($active ? "#666" : "#ffffff")};
  }
`;

const CrossfadeContainer = styled.div`
  position: relative;
  width: 100%;
  /* 리스트/맵 영역 높이를 잡아줘야 겹쳐서 렌더링해도 레이아웃이 안정적 */
`;

const CrossfadeLayer = styled.div<{
  $visible: boolean; // 지금 보여줄 레이어인가
  $active: boolean; // 현재 최종 모드인가(버튼 하이라이트 유지용)
  $isFading: boolean;
  $scroll?: boolean;
}>`
  position: ${({ $visible }) => ($visible ? "relative" : "absolute")};
  inset: 0;
  width: 100%;

  transition: opacity 220ms ease;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};

  /* 전환 중/비활성 레이어 클릭 방지 */
  pointer-events: ${({ $visible }) => ($visible ? "auto" : "none")};
  ${({ $scroll }) =>
    $scroll &&
    css`
      max-height: calc(100vh - 220px); /* 헤더/탭/하단 버튼 고려해서 적당히 */
      overflow: auto;
      -webkit-overflow-scrolling: touch;
    `}

  /* 겹칠 때 약간 자연스럽게(선택) */
  transform: ${({ $visible, $isFading }) =>
    $isFading ? ($visible ? "translateY(0px)" : "translateY(2px)") : "none"};
  transition-property: opacity, transform;
  transition-duration: 220ms;
  transition-timing-function: ease;
`;

/* (선택) 리스트 영역 래퍼 */
const ListView = styled.div`
  width: 100%;
`;

const MapGrid = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 0 12px;

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const MapThumb = styled.button`
  border: none;
  background: #fff;
  border-radius: 14px;
  padding: 10px;
  text-align: left;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  cursor: pointer;

  &:active {
    transform: scale(0.99);
  }
`;

const MapThumbTitle = styled.div`
  font-weight: 900;
  font-size: 14px;
  margin-bottom: 8px;
`;

const MapThumbHint = styled.div`
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 700;
`;

const MapSingle = styled.button`
  width: 100%;
  max-width: 100%;
  border: none;
  background: #fff;
  border-radius: 14px;
  padding: 12px;
  cursor: pointer;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MapImg = styled.img`
  width: 100%;
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  display: block;
`;

const MapSingleTitle = styled.div`
  font-weight: 900;
  font-size: 15px;
`;

const MapSingleHint = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  font-weight: 700;
`;

const ZoomOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
`;

const ZoomSheet = styled.div`
  width: 100%;
  max-width: 920px;
  max-height: 92vh;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ZoomHeader = styled.div`
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
`;

const ZoomTitle = styled.div`
  font-weight: 900;
`;

const ZoomClose = styled.button`
  border: none;
  background: #111;
  color: #fff;
  font-weight: 800;
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
`;

const ZoomBody = styled.div`
  padding: 12px;
  overflow: hidden; /* ✅ 내부 pan/zoom에 스크롤이 간섭하지 않게 */
  height: calc(92vh - 56px); /* 헤더 높이 제외. 필요하면 숫자 조정 */
`;

const ZoomImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
  touch-action: none; /* ✅ iOS에서 제스처 충돌 방지 */
`;

const MapSingleWrap = styled.div`
  width: 100%;
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MapMulti = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 12px;

  @media (min-width: 520px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ZoomHeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ZoomNavBtn = styled.button`
  border: none;
  background: rgba(0, 0, 0, 0.08);
  color: #111;
  font-weight: 900;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 999px;
  cursor: pointer;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
`;

const ZoomToolbar = styled.div`
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 8px;
  padding-bottom: 10px;
`;

const ZoomToolBtn = styled.button`
  border: none;
  background: rgba(0, 0, 0, 0.08);
  color: #111;
  font-weight: 900;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 999px;
  cursor: pointer;
`;
