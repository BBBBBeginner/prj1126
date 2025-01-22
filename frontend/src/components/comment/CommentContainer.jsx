import {
  Box,
  Heading,
  Spinner,
  Stack,
  useBreakpointValue,
} from "@chakra-ui/react";
import { CommentInput } from "./CommentInput.jsx";
import { CommentList } from "./CommentList.jsx";
import { useEffect, useState } from "react";
import axios from "axios";

export function CommentContainer({ boardId }) {
  const [commentList, setCommentList] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true); // 로딩 상태 추가

  // 반응형 스타일 조정: 댓글 제목의 크기를 뷰포트 크기에 따라 변경
  const headingSize = useBreakpointValue({ base: "md", md: "lg", lg: "xl" });

  useEffect(() => {
    if (!boardId) {
      console.error("boardId is undefined. Please check parent component.");
      return;
    }

    setLoading(true); // 로딩 시작
    axios
      .get(`/api/comment/list/${boardId}`)
      .then((res) => res.data)
      .then((data) => setCommentList(data))
      .catch((err) => {
        console.error("Failed to fetch comment list:", err);
      })
      .finally(() => setLoading(false)); // 로딩 종료
  }, [boardId]);

  function handleSaveClick(comment) {
    if (!boardId) {
      console.error("Cannot save comment: boardId is undefined.");
      return;
    }

    setProcessing(true);
    axios
      .post("/api/comment/add", {
        boardId,
        comment,
      })
      .then((newComment) => {
        setCommentList((prevList) => [...prevList, newComment]); // 목록에 추가
        console.log("Comment added successfully");
        window.location.reload(); // 댓글 추가 후 페이지 새로 고침
      })
      .catch((err) => {
        console.error("Failed to add comment:", err);
      })
      .finally(() => setProcessing(false));
  }

  function handleDeleteClick(id) {
    setProcessing(true);
    axios
      .delete(`/api/comment/remove/${id}`)
      .then(() => {
        setCommentList((prevList) =>
          prevList.filter((comment) => comment.id !== id),
        ); // 목록에서 제거
        console.log("Comment deleted successfully");
        window.location.reload(); // 댓글 삭제 후 페이지 새로 고침
      })
      .catch((err) => {
        console.error("Failed to delete comment:", err);
      })
      .finally(() => setProcessing(false));
  }

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box
      pt={5}
      px={{ base: 4, md: 8, lg: 12 }} // 화면 크기에 따라 패딩 조정
      maxWidth={{ base: "100%", md: "800px", lg: "1200px" }} // 최대 폭 조정
      mx="auto" // 중앙 정렬
    >
      <Heading size={headingSize} textAlign="center" mb={4}>
        댓글
      </Heading>
      <Stack spacing={6}>
        <CommentInput boardId={boardId} onSaveClick={handleSaveClick} />
        <CommentList
          boardId={boardId}
          commentList={commentList}
          onDeleteClick={handleDeleteClick}
        />
      </Stack>
    </Box>
  );
}
