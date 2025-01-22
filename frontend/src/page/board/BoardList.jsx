import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  IconButton,
  Image,
  Input,
  Table,
  Text,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LuSearch } from "react-icons/lu";
import {
  NativeSelectField,
  NativeSelectRoot,
} from "../../components/ui/native-select.jsx";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "../../components/ui/pagination";
import Slider from "react-slick";
import { AuthenticationContext } from "../../context/AuthenticationProvider.jsx";

export function BoardList() {
  // 게시판 데이터 상태
  const [boardList, setBoardList] = useState([]);
  // 검색 키워드
  const [keyword, setKeyword] = useState("");
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);
  // 에러 메시지 상태
  const [errorMessage, setErrorMessage] = useState("");
  // 검색 데이터
  const [searchParams, setSearchParams] = useSearchParams("");
  // 검색 타입(제목...)
  const [type, setType] = useState("all"); // 검색 타입 (전체, 제목, 본문 중 선택)
  // 검색 타입(장소)
  const [site, setSite] = useState("allSite");
  // 조회수 탑 3개 받기
  const [topBoards, setTopBoards] = useState([]);
  // 좋아요 탑 3개 받기
  const [likeTopBoards, setLikeTopBoards] = useState([]);
  // like 횟수
  const [likeCount, setLikeCount] = useState([]);

  const [searchPage, setSearchPage] = useSearchParams();
  const [count, setCount] = useState(0);

  const navigate = useNavigate();
  const authentication = useContext(AuthenticationContext);

  useEffect(() => {
    fetchBoardList();
    fetchTopBoards();
    fetchLikeTopBoards();
    howManyLike();
  }, [searchParams, type, site, searchPage]);

  const howManyLike = async () => {
    try {
      const response = await axios.get("/api/board/likeCount");
      setLikeCount(response.data);
      setLikeTopBoards(response.data);
    } catch (error) {
      console.error("좋아요 갯수 카운트 실패");
    }
  };

  const fetchLikeTopBoards = async () => {
    try {
      const response = await axios.get("/api/board/top-like"); // 상위 3개 좋아요 API 호출
      setLikeTopBoards(response.data); // 데이터 저장
    } catch (error) {
      console.error("인기 게시글 데이터를 가져오는 데 실패했습니다.");
    }
  };

  const fetchTopBoards = async () => {
    try {
      const response = await axios.get("/api/board/top-views"); // 상위 3개 조회수 API 호출
      setTopBoards(response.data); // 데이터 저장
    } catch (error) {
      console.error("인기 게시글 데이터를 가져오는 데 실패했습니다.");
    }
  };

  // page 번호
  const pageParam = searchPage.get("page") ? searchPage.get("page") : "1";
  const page = Number(searchParams.get("page") || "1");

  const handlePageChange = (e) => {
    const nextSearchParams = new URLSearchParams(searchPage);
    nextSearchParams.set("page", e.page);
    setSearchPage(nextSearchParams);
  };

  const fetchBoardList = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/board/list", {
        params: Object.fromEntries(searchPage.entries()), //**URL의 쿼리스트링을 서버로 전달
        //entries() : 키-값 쌍의 반복 가능한 이터레이터
      });

      setBoardList(response.data.list);
      setCount(response.data.count);
    } catch (error) {
      console.error("데이터를 불러오는데 실패했습니다.");
      setErrorMessage("데이터를 불러오는 데 실패하였습니다."); // ** 에러 메시지 추가
    } finally {
      setIsLoading(false);
    }
  };

  /*클릭 시 조회수 증가 처리 추가*/
  const handleRowClick = async (number) => {
    try {
      navigate(`/board/view/${number}`);
      await axios.post(`/api/board/list/${number}`);
    } catch (error) {
      console.error("조회수를 증가시키는 데 실패했습니다.");
    }
  };

  const handleWriteClick = () => {
    if (authentication.isAuthenticated) {
      navigate("/board/add"); // 로그인 상태에서 이동
    } else {
      window.alert("로그인이 필요합니다. 로그인 후 게시글 작성이 가능합니다."); // 경고창 표시
    }
  };

  return (
    <Box
      style={{
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
      }}
    >
      <Center>
        <HStack
          mb={4}
          w={"80%"}
          justifyContent="center"
          style={{ gap: "20px" }}
        >
          {/* 드롭다운 - 낚시 장소 */}
          <NativeSelectRoot
            style={{
              width: "175px",
              maxHeight: "50px",
              fontSize: "14px",
              padding: "5px",
              border: "1px solid #0288d1",
              borderRadius: "4px",
            }}
          >
            <NativeSelectField
              value={site}
              onChange={(e) => setSite(e.target.value)}
            >
              <option value={"allSite"}>민물/바다</option>
              <option value={"riverSite"}>민물낚시</option>
              <option value={"seaSite"}>바다낚시</option>
            </NativeSelectField>
          </NativeSelectRoot>

          {/* 드롭다운 - 검색 타입 */}
          <NativeSelectRoot
            style={{
              width: "150px",
              maxHeight: "50px",
              fontSize: "14px",
              padding: "5px",
              border: "1px solid #0288d1",
              borderRadius: "4px",
            }}
          >
            <NativeSelectField
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value={"all"}>전체</option>
              <option value={"title"}>제목</option>
              <option value={"content"}>본문</option>
              <option value={"writer"}>작성자</option>
            </NativeSelectField>
          </NativeSelectRoot>

          {/* 검색창 */}
          <Input
            placeholder="검색어를 입력하세요"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              maxWidth: "700px",
              width: "100%",
              maxHeight: "50px",
              height: "50px",
              padding: "8px",
              fontSize: "14px",
              border: "1px solid #0288d1",
              borderRadius: "20px",
              backgroundColor: "#ffffff",
            }}
          />

          {/* 검색 버튼 */}
          <IconButton
            aria-label="Search database"
            onClick={(e) => setSearchParams({ type, keyword, site })} // **
            style={{
              maxHeight: "50px",
              height: "30px",
              padding: "5px",
              color: "white",
              border: "none",
              borderRadius: "20px",
              cursor: "pointer",
            }}
          >
            <LuSearch />
          </IconButton>
        </HStack>
      </Center>

      {/* 조회수 Top 5 */}
      <Center mt="30px">
        {" "}
        {/* 여백을 30px로 더 좁혔습니다 */}
        <Box w="60%" zIndex={1} p="2">
          <h3
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#0288d1",
              marginBottom: "15px", // 제목과 슬라이더 사이 여백 축소
              textAlign: "center",
            }}
          >
            조회수 Top 5
          </h3>
          {topBoards.length > 0 ? (
            <Slider
              {...{
                autoplay: true, // 자동 슬라이드 활성화
                autoplaySpeed: 3000, // 3초 단위로 슬라이드 변경
                dots: false, // 점 표시 활성화
                infinite: true, // 무한 반복
                speed: 1500, // 애니메이션 속도
                slidesToShow: 5, // 한 번에 5개의 슬라이드 표시
                slidesToScroll: 1, // 한 번에 1개의 슬라이드 스크롤
                responsive: [
                  {
                    breakpoint: 1024, // 태블릿 화면 이하
                    settings: {
                      slidesToShow: 3, // 슬라이드 3개 표시
                    },
                  },
                  {
                    breakpoint: 768, // 모바일 화면 이하
                    settings: {
                      slidesToShow: 1, // 슬라이드 1개 표시
                    },
                  },
                ],
              }}
            >
              {topBoards.slice(0, 5).map((board, index) => (
                <Box
                  key={board.number}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  p={4}
                >
                  {/* 순위 표시 */}
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#0288d1",
                      marginBottom: "10px",
                      textAlign: "center",
                    }}
                  >
                    Top {index + 1}
                  </h3>
                  {/* 이미지 */}
                  <Image
                    rounded="md"
                    src={
                      board.fileList && board.fileList.length > 0
                        ? board.fileList[0].src
                        : "https://via.placeholder.com/150"
                    }
                    alt={board.title}
                    style={{
                      width: "300px", // 이미지 너비
                      height: "200px", // 이미지 높이
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    onClick={() => handleRowClick(board.number)} // 클릭 시 게시글 이동
                  />
                  {/* 조회수 */}
                  <Text
                    mt="8px"
                    fontSize="sm"
                    color="gray.500"
                    textAlign="center"
                  >
                    조회수: {board.viewCount}
                  </Text>
                  {/* 제목 */}
                  <Text
                    mt={1}
                    fontSize="lg"
                    fontWeight="bold"
                    color="#0288d1"
                    textAlign="center"
                    noOfLines={1} // 제목 한 줄로 제한
                  >
                    {board.title.length > 10
                      ? `${board.title.slice(0, 10)}...` // 10자 이상이면 '...' 추가
                      : board.title}
                  </Text>
                </Box>
              ))}
            </Slider>
          ) : (
            <Box textAlign="center" py="10">
              <Text>조회수 Top 5 게시글이 없습니다</Text>
            </Box>
          )}
        </Box>
      </Center>

      {/*일반 게시물 등록*/}
      <Table.Root
        interactive
        style={{
          margin: "0 auto",
          width: "100%",
          borderCollapse: "collapse",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader
              style={{
                padding: "8px",
                backgroundColor: "#0288d1",
                color: "white",
                border: "1px solid #ddd",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                whiteSpace: "normal", // 줄바꿈 허용
                wordWrap: "break-word", // 긴 텍스트 줄바꿈
              }}
            >
              번호
            </Table.ColumnHeader>
            <Table.ColumnHeader
              style={{
                padding: "8px",
                backgroundColor: "#0288d1",
                color: "white",
                border: "1px solid #ddd",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                whiteSpace: "normal",
                wordWrap: "break-word",
              }}
            >
              낚시 장소
            </Table.ColumnHeader>
            <Table.ColumnHeader
              style={{
                padding: "8px",
                backgroundColor: "#0288d1",
                color: "white",
                border: "1px solid #ddd",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                whiteSpace: "normal",
                wordWrap: "break-word",
              }}
            >
              제목
            </Table.ColumnHeader>
            <Table.ColumnHeader
              style={{
                padding: "8px",
                backgroundColor: "#0288d1",
                color: "white",
                border: "1px solid #ddd",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                whiteSpace: "normal",
                wordWrap: "break-word",
              }}
            >
              작성자
            </Table.ColumnHeader>
            <Table.ColumnHeader
              style={{
                padding: "8px",
                backgroundColor: "#0288d1",
                color: "white",
                border: "1px solid #ddd",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                whiteSpace: "normal",
                wordWrap: "break-word",
              }}
            >
              조회수
            </Table.ColumnHeader>
            <Table.ColumnHeader
              style={{
                padding: "8px",
                backgroundColor: "#0288d1",
                color: "white",
                border: "1px solid #ddd",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                whiteSpace: "normal",
                wordWrap: "break-word",
              }}
            >
              좋아요
            </Table.ColumnHeader>
            <Table.ColumnHeader
              style={{
                padding: "8px",
                backgroundColor: "#0288d1",
                color: "white",
                border: "1px solid #ddd",
                textAlign: "center",
                fontWeight: "bold",
                fontSize: "14px",
                whiteSpace: "normal",
                wordWrap: "break-word",
              }}
            >
              작성일시
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {boardList.map((board) => (
            <Table.Row
              key={board.number}
              onClick={() => handleRowClick(board.number)}
              cursor="pointer"
              _hover={{ backgroundColor: "#e0f7fa" }}
              style={{
                transition: "background-color 0.2s ease",
                padding: "8px",
                border: "1px solid #ddd",
              }}
            >
              <Table.Cell
                style={{
                  padding: "8px",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                {board.number}
              </Table.Cell>
              <Table.Cell
                style={{
                  padding: "8px",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                {board.site}
              </Table.Cell>
              <Table.Cell
                style={{
                  padding: "8px",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                {board.title}
              </Table.Cell>
              <Table.Cell
                style={{
                  padding: "8px",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                {board.writer}
              </Table.Cell>
              <Table.Cell
                style={{
                  padding: "8px",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                {board.viewCount}
              </Table.Cell>
              <Table.Cell
                style={{
                  padding: "8px",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                {likeCount.find((l) => l.number === board.number)?.likeCount ||
                  "0"}
              </Table.Cell>
              <Table.Cell
                style={{
                  padding: "8px",
                  textAlign: "center",
                  whiteSpace: "normal",
                  wordWrap: "break-word",
                }}
              >
                {board.date}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* 페이지네이션 */}
      <Box mt={5} mb={5}>
        <Flex
          direction={{ base: "column", md: "row" }} // 반응형: 작은 화면에서 세로 정렬
          align={{ base: "center", md: "center" }} // 중앙 정렬
          justify={{ base: "center", md: "space-between" }} // 양쪽 정렬 (큰 화면에서)
          gap={4}
          wrap="wrap" // 작은 화면에서 줄바꿈 허용
        >
          {/* 페이지네이션 중앙 */}
          <HStack
            gap={2}
            justify="center"
            wrap="wrap" // 작은 화면에서 줄바꿈
          >
            <PaginationRoot
              onPageChange={handlePageChange}
              count={count}
              pageSize={10}
              page={page}
            >
              <PaginationPrevTrigger />
              <PaginationItems />
              <PaginationNextTrigger />
            </PaginationRoot>
          </HStack>

          {/* 게시글 작성 버튼 */}
          <Button
            variant="solid"
            onClick={handleWriteClick}
            style={{
              backgroundColor: "#0288d1",
              color: "white",
              padding: "8px 12px",
              borderRadius: "20px",
              cursor: "pointer",
            }}
            size="sm"
            minW="120px" // 최소 너비 설정
          >
            게시글 작성
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
