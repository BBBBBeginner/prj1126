package com.example.backend.controller.board;

import com.example.backend.dto.board.*;
import com.example.backend.service.board.BoardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

    final BoardService service;

    @GetMapping("boardMain")
    public List<Announcement> boardMain() {
        return service.mainBanner();
    }

    @GetMapping("fishingAddress")
    public List<FishingAddress> fishingAddress() {
        System.out.println("들어옴");
        return service.selectFishingAddress();
    }


    @GetMapping("question")
    public Map<String, Object> divide(@RequestParam(value = "page", defaultValue = "1") Integer page) {
        return service.listQuestion(page);
    }

    @PostMapping("questionAdd")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> questionAdd(
            Question question,
            @RequestParam(value = "files[]", required = false) MultipartFile[] files,
            Authentication auth) {

        if (service.validateQues(question)) {
            if (service.addQues(question, auth, files)) {
                return ResponseEntity.ok().body(
                        Map.of("message",
                                Map.of("type", "success", "text", question.getId() + "번 게시글이 등록되었습니다."),
                                "data", question));
            } else {
                return ResponseEntity.internalServerError().body(
                        Map.of("message",
                                Map.of("type", "warning", "text", "등록되지 않았습니다..")));
            }

        } else {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            Map.of("type", "warning", "text", "제목과 본문을  입력해주세요.")));
        }
    }

    @GetMapping("questionView/{id}")
    public Question questionView(@PathVariable int id) {
        return service.getQuesView(id);
    }

    @PutMapping("updateQuestion")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updateQuestion(Question question,
                                                              @RequestParam(value = "removeFiles[]", required = false) List<String> removeFiles,
                                                              @RequestParam(value = "uploadFiles[]", required = false) MultipartFile[] updateFiles,
                                                              Authentication auth) {

        if (service.hasAccessQues(question.getId(), auth)) {
            if (service.validateQues(question)) {
                if (service.updateQues(question, removeFiles, updateFiles)) {
                    return ResponseEntity.ok()
                            .body(Map.of("message", Map.of("type", "success",
                                            "text", question.getId() + "번 게시물이 수정 되었습니다."),
                                    "data", question));
                } else {
                    return ResponseEntity.internalServerError()
                            .body(Map.of("message", Map.of("type", "error",
                                    "text", "게시글이 수정되지 않았습니다.")));
                }
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", Map.of("type", "error",
                                "text", "제목이나 본문이 비어있습니다.")));
            }

        } else {
            return ResponseEntity.status(403)
                    .body(Map.of("message", Map.of("type", "error"
                            , "text", "수정 권한이 없습니다.")));
        }
    }

    @DeleteMapping("deleteQues/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> deleteQuestion(@PathVariable int id, Authentication auth) {
        if (service.hasAccessQues(id, auth)) {
            if (service.removeQues(id)) {
                return ResponseEntity.ok()
                        .body(Map.of("message", Map.of("type", "success",
                                "text", id + "번 게시물이 삭제 되었습니다.")));

            } else {
                return ResponseEntity.internalServerError()
                        .body(Map.of("message", Map.of("type", "error",
                                "text", "게시물이 삭제 되지 않았습니다.")));
            }
        } else {
            return ResponseEntity.status(403)
                    .body(Map.of("message", Map.of("type", "error",
                            "text", "권한이 없습니다.")));
        }
    }


    @GetMapping("announcement")
    public Map<String, Object> announcement(@RequestParam(value = "page", defaultValue = "1") Integer page) {
        return service.listAnnouncement(page);
    }


    @GetMapping("viewAnn/{id}")
    public Announcement announcementView(@PathVariable int id) {
        return service.getAnnView(id);
    }

    @PostMapping("annAdd")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> announcementAdd(
            Announcement announcement,
            @RequestParam(value = "files[]", required = false) MultipartFile[] files,
            Authentication auth) {

        if (service.validateAnn(announcement)) {
            if (service.addAnn(announcement, auth, files)) {
                System.out.println("announcement = " + announcement);
                return ResponseEntity.ok().body(
                        Map.of("message",
                                Map.of("type", "success", "text", announcement.getId() + "번 게시글이 등록되었습니다."),
                                "data", announcement));
            } else {
                return ResponseEntity.internalServerError().body(
                        Map.of("message",
                                Map.of("type", "warning", "text", "등록되지 않았습니다..")));
            }

        } else {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            Map.of("type", "warning", "text", "제목과 본문을  입력해주세요.")));
        }

    }

    @PutMapping("updateAnn")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> updateAnn(Announcement announcement,
                                                         @RequestParam(value = "removeFiles[]", required = false) List<String> removeFiles,
                                                         @RequestParam(value = "uploadFiles[]", required = false) MultipartFile[] updateFiles,
                                                         Authentication auth) {

        if (service.hasAccessAnn(announcement.getId(), auth)) {
            if (service.validateAnn(announcement)) {
                if (service.updateAnn(announcement, removeFiles, updateFiles)) {
                    return ResponseEntity.ok()
                            .body(Map.of("message", Map.of("type", "success",
                                            "text", announcement.getId() + "번 게시물이 수정 되었습니다."),
                                    "data", announcement));
                } else {
                    return ResponseEntity.internalServerError()
                            .body(Map.of("message", Map.of("type", "error",
                                    "text", "게시글이 수정되지 않았습니다.")));
                }
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", Map.of("type", "error",
                                "text", "제목이나 본문이 비어있습니다.")));
            }

        } else {
            return ResponseEntity.status(403)
                    .body(Map.of("message", Map.of("type", "error"
                            , "text", "수정 권한이 없습니다.")));
        }
    }

    @DeleteMapping("deleteAnn/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> deleteAnn(@PathVariable int id, Authentication auth) {
        if (service.hasAccessAnn(id, auth)) {
            if (service.removeAnn(id)) {
                return ResponseEntity.ok()
                        .body(Map.of("message", Map.of("type", "success",
                                "text", id + "번 게시물이 삭제 되었습니다.")));

            } else {
                return ResponseEntity.internalServerError()
                        .body(Map.of("message", Map.of("type", "error",
                                "text", "게시물이 삭제 되지 않았습니다.")));
            }
        } else {
            return ResponseEntity.status(403)
                    .body(Map.of("message", Map.of("type", "error",
                            "text", "권한이 없습니다.")));
        }
    }

    @GetMapping("list")
    public Map<String, Object> searchBoards(@RequestParam(value = "keyword", defaultValue = "") String search,
                                            @RequestParam(value = "type", defaultValue = "all") String type,
                                            @RequestParam(value = "site", defaultValue = "allSite") String site,
                                            @RequestParam(value = "page", defaultValue = "1") Integer page
    ) {
        return service.getAllBoards(search, type, site, page);
    }

    @GetMapping("/top-views")
    public List<Board> getTopBoardsByViews() {
        return service.getTopBoardsByViews();
    }

    @GetMapping("/top-like")
    public List<Board> getTopBoardsByLikes() {
        return service.getTopBoardsByLike();
    }

    @GetMapping("/likeCount")
    public List<Board> getLikeCount() {
        return service.getLikeCount();
    }

    @PostMapping("/list/{number}")
    public void increaseViewCount(@PathVariable Integer number) {
        service.increaseViewCount(number);
    }

    @PostMapping("add")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> add(
            Board board,
            @RequestParam(value = "files[]", required = false) MultipartFile[] files,
            Authentication authentication,
            KakaoMapAddress addr) {

        if (service.validate(board)) {
            if (service.add(board, files, authentication)) {
                service.insertAddress(addr.getAddressName(), addr.getAddressLng(), addr.getAddressLat(), board.getNumber());
                return ResponseEntity.ok()
                        .body(Map.of("message", Map.of("type", "success",
                                        "text", board.getNumber() + "번 게시물이 등록 되었습니다."),
                                "data", board));
            } else {
                return ResponseEntity.internalServerError()
                        .body(Map.of("message", Map.of("type", "warning",
                                "text", "게시물 등록이 실패하였습니다.")));
            }
        } else {
            return ResponseEntity.badRequest().body(Map.of("message", Map.of("type", "warning",
                    "text", "제목이나 본문이 비어있을 수 없습니다.")));
        }
    }

    @GetMapping("view/{number}")
    public Board view(@PathVariable int number) {
        return service.get(number);
    }

    @DeleteMapping("delete/{number}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> delete(
            @PathVariable int number,
            Authentication auth) {
        if (service.hasAccess(number, auth)) {
            if (service.remove(number)) {
                return ResponseEntity.ok()
                        .body(Map.of("message", Map.of("type", "success"
                                , "text", number + "번 게시글이 삭제되었습니다.")));
            } else {
                return ResponseEntity.internalServerError()
                        .body(Map.of("message", Map.of("type", "error"
                                , "text", "게시글 삭제 중 문제가 발생하였습니다.")));
            }

        } else {
            return ResponseEntity.status(403)
                    .body(Map.of("message", Map.of("type", "error"
                            , "text", "삭제 권한이 없습니다.")));
        }
    }


    @PutMapping("update")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> update(
            Board board,
            @RequestParam(value = "removeFiles[]", required = false) List<String> removeFiles,
            @RequestParam(value = "uploadFiles[]", required = false) MultipartFile[] uploadFiles,
            Authentication authentication,
            KakaoMapAddress addr) {
        if (service.hasAccess(board.getNumber(), authentication)) {
            if (service.validate(board)) {
                if (service.update(board, removeFiles, uploadFiles)) {
                    service.updateAddress(addr.getAddressName(), addr.getAddressLng(), addr.getAddressLat(), board.getNumber());
                    return ResponseEntity.ok()
                            .body(Map.of("message", Map.of("type", "success",
                                    "text", board.getNumber() + "번 게시물이 수정 되었습니다.")));
                } else {
                    return ResponseEntity.internalServerError()
                            .body(Map.of("message", Map.of("type", "error",
                                    "text", board.getNumber() + "번 게시물이 수정되지 않았습니다.")));
                }

            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", Map.of("type", "warning",
                                "text", "제목이나 본문이 비어있을 수 없습니다.")));
            }
        } else {
            return ResponseEntity.status(403)
                    .body(Map.of("message", Map.of("type", "error"
                            , "text", "수정 권한이 없습니다.")));
        }
    }

    @GetMapping("written/{id}")
    public ResponseEntity<List<Board>> getBoardsByMemberId(@PathVariable("id") String id) {
        List<Board> boards = service.getBoardsByMemberId(id);
        return ResponseEntity.ok(boards);
    }

    @PostMapping("view/increment/{number}")
    public ResponseEntity<?> incrementViewCount(@PathVariable int number) {
        try {
            int updatedViewCount = service.getViewCount(number);

            // 증가된 조회수를 클라이언트에 반환
            return ResponseEntity.ok(Map.of("viewCount", updatedViewCount));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("조회수 증가 실패");
        }
    }

    @GetMapping("like/{number}")
    public Map<String, Object> getLike(@PathVariable int number,
                                       Authentication auth) {
        return service.getLike(number, auth);
    }

    @PostMapping("like")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> like(@RequestBody Board board,
                                    Authentication authentication) {
        return service.like(board, authentication);
    }


}
