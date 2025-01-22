import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Box, Center, Heading, HStack, Stack, Table } from "@chakra-ui/react";
import { Button } from "../../components/ui/button.jsx";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "../../components/ui/pagination";
import { AuthenticationContext } from "../../context/AuthenticationProvider.jsx";

export function BoardQuestion() {
  const [queList, setQueList] = useState([]);
  const [count, setCount] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useContext(AuthenticationContext);
  const navigate = useNavigate();

  const pageParam = searchParams.get("page") ? searchParams.get("page") : "1";
  const page = Number(pageParam);

  useEffect(() => {
    // CleanUp : 이전 페이지 요청 취소하고 현재 페이지로 다시 업데이트
    const controller = new AbortController();
    axios
      .get("/api/board/question", {
        params: searchParams,
        signal: controller.signal,
      })
      .then((res) => res.data)
      .then((data) => {
        setQueList(data.list);
        setCount(data.count);
      });

    return () => {
      controller.abort();
    };
  }, [searchParams]);

  const handleWriteContent = () => {
    navigate("/board/questionAdd");
  };

  function handlePageChange(e) {
    const nextSearchParam = new URLSearchParams(searchParams);
    nextSearchParam.set("page", e.page);
    setSearchParams(nextSearchParam);
  }

  function handleRowClick(id) {
    navigate(`/board/questionView/${id}`);
  }

  return (
    <Stack
      w={{ base: "95%", md: "80%", lg: "70%" }} // 반응형 너비 설정
      mx="auto"
      spacing={5} // 섹션 간 간격
      p={{ base: 3, md: 5 }} // 반응형 여백
    >
      <Heading
        fontSize={{ base: "24px", md: "28px", lg: "30px" }} // 반응형 폰트 크기
        pb={3}
        color={"blue.800"}
        textAlign="center" // 제목 중앙 정렬
      >
        질문게시판
      </Heading>
      <Box as="hr" />

      <Table.Root
        size="sm"
        interactive
        style={{
          width: "100%",
          borderCollapse: "collapse",
          margin: "0 auto",
        }}
      >
        <Table.Header>
          <Table.Row bg="blue.100">
            <Table.ColumnHeader
              w={{ base: "20%", md: "10%" }} // 반응형 열 너비
              whiteSpace={"nowrap"}
              textAlign={"center"}
            >
              번호
            </Table.ColumnHeader>
            <Table.ColumnHeader
              w={{ base: "50%", md: "30%" }}
              whiteSpace={"nowrap"}
            >
              제목
            </Table.ColumnHeader>
            <Table.ColumnHeader
              w={{ base: "30%", md: "15%" }}
              whiteSpace={"nowrap"}
              textAlign={"center"}
            >
              작성자
            </Table.ColumnHeader>
            <Table.ColumnHeader
              w={{ base: "40%", md: "10%" }}
              whiteSpace={"nowrap"}
            >
              작성일
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {queList.map((board) => (
            <Table.Row
              key={board.id}
              onClick={() => handleRowClick(board.id)}
              _hover={{ bg: "gray.100" }} // 행 호버 효과
              cursor="pointer"
            >
              <Table.Cell whiteSpace={"nowrap"} textAlign={"center"}>
                {board.id}
              </Table.Cell>
              <Table.Cell whiteSpace={"nowrap"}>{board.title}</Table.Cell>
              <Table.Cell whiteSpace={"nowrap"} textAlign={"center"}>
                {board.writer}
              </Table.Cell>
              <Table.Cell whiteSpace={"nowrap"}>{board.inserted}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      <Box ml="auto" w="100%" textAlign={{ base: "center", md: "right" }}>
        {isAuthenticated && (
          <Button
            onClick={handleWriteContent}
            w={{ base: "100%", md: "auto" }} // 반응형 버튼 너비
            mt={{ base: 4, md: 0 }} // 모바일에서 위 간격 추가
          >
            질문하기
          </Button>
        )}
      </Box>

      <Center>
        <PaginationRoot
          onPageChange={handlePageChange}
          count={count}
          pageSize={10}
          page={page}
          variant="solid"
        >
          <HStack spacing={3}>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </HStack>
        </PaginationRoot>
      </Center>
    </Stack>
  );
}
