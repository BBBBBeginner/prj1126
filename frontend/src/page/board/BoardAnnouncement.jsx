import React, { useContext, useEffect, useState } from "react";
import { Box, Center, Heading, HStack, Stack, Table } from "@chakra-ui/react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "../../components/ui/pagination";
import { Button } from "../../components/ui/button.jsx";
import { AuthenticationContext } from "../../context/AuthenticationProvider.jsx";

export function BoardAnnouncement() {
  const [anList, setAnList] = useState([]);
  const [count, setCount] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin } = useContext(AuthenticationContext);

  // 페이지 번호 얻기
  const pageParam = searchParams.get("page") ? searchParams.get("page") : "1";
  const page = Number(pageParam);

  useEffect(() => {
    // CleanUp : 이전 페이지 요청 취소하고 현재 페이지로 다시 업데이트
    const controller = new AbortController();
    axios
      .get("/api/board/announcement", {
        params: searchParams,
        signal: controller.signal,
      })
      .then((res) => res.data)
      .then((data) => {
        setAnList(data.list);
        setCount(data.count);
      });

    return () => {
      controller.abort();
    };
  }, [searchParams]);

  function handlePageChange(e) {
    const nextSearchParam = new URLSearchParams(searchParams);
    nextSearchParam.set("page", e.page);
    setSearchParams(nextSearchParam);
  }

  const handleWriteContent = () => {
    navigate("/board/annAdd");
  };

  function handleRowClick(id) {
    navigate(`/board/viewAnn/${id}`);
  }

  return (
    <Stack
      w={{ base: "100%", md: "80%", lg: "70%" }} // 반응형 너비 조정
      mx="auto"
      p={{ base: 3, md: 5 }} // 여백 조정
      spacing={5}
    >
      <Heading
        fontSize={{ base: "20px", md: "25px", lg: "30px" }} // 제목 크기 조정
        pb={3}
        color="blue.800"
        textAlign="center" // 중앙 정렬
      >
        공지사항
      </Heading>
      <Box as="hr" />

      {/* 반응형 테이블 */}
      <Table.Root size="sm" interactive>
        <Table.Header>
          <Table.Row bg="blue.100">
            <Table.ColumnHeader
              w={{ base: "20%", md: "10%" }} // 반응형 폭 조정
              whiteSpace="nowrap"
              textAlign="center"
            >
              번호
            </Table.ColumnHeader>
            <Table.ColumnHeader
              w={{ base: "50%", md: "30%" }} // 제목 열 크기 조정
              whiteSpace="nowrap"
            >
              제목
            </Table.ColumnHeader>
            <Table.ColumnHeader
              w={{ base: "30%", md: "15%" }}
              whiteSpace="nowrap"
              textAlign="center"
            >
              작성자
            </Table.ColumnHeader>
            <Table.ColumnHeader
              w={{ base: "30%", md: "10%" }}
              whiteSpace="nowrap"
            >
              작성일
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {anList.map((board) => (
            <Table.Row key={board.id} onClick={() => handleRowClick(board.id)}>
              <Table.Cell whiteSpace="nowrap" textAlign="center">
                {board.id}
              </Table.Cell>
              <Table.Cell whiteSpace="nowrap">{board.title}</Table.Cell>
              <Table.Cell whiteSpace="nowrap" textAlign="center">
                {board.writer}
              </Table.Cell>
              <Table.Cell whiteSpace="nowrap">{board.inserted}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* 글쓰기 버튼 (관리자만 표시) */}
      <Box ml="auto" w={{ base: "100%", md: "auto" }} textAlign="center">
        {isAdmin && (
          <Button
            onClick={handleWriteContent}
            w={{ base: "100%", md: "auto" }} // 버튼 크기 반응형 조정
            mt={{ base: 4, md: 0 }}
          >
            글쓰기
          </Button>
        )}
      </Box>

      {/* 페이지네이션 */}
      <Center>
        <PaginationRoot
          onPageChange={handlePageChange}
          count={count}
          pageSize={10}
          page={page}
          variant="solid"
        >
          <HStack spacing={2}>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </HStack>
        </PaginationRoot>
      </Center>
    </Stack>
  );
}

export default BoardAnnouncement;
