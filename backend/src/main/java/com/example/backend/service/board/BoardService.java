package com.example.backend.service.board;

import com.example.backend.dto.board.*;
import com.example.backend.mapper.board.BoardMapper;
import com.example.backend.mapper.comment.QuestionCommentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional
@RequiredArgsConstructor
public class BoardService {

    final S3Client s3;
    final QuestionCommentMapper questionCommentMapper;
    private final BoardMapper mapper;
    @Value("${image.src.prefix}")
    String imageSrcPrefix;

    @Value("${bucket.name}")
    String bucketName;

    public Map<String, Object> getAllBoards(String search, String type, String site, Integer page) {
        int offset = (page - 1) * 10; // 페이지네이션을 위한 offset 계산
        List<Board> boards = mapper.findAllBoards(search, type, site, offset); // 검색 결과 가져오기
        Integer totalCount = mapper.countBoardsBySearch(search, type, site); // 검색된 게시글 개수 반환

        // 검색 결과 리스트와 개수를 Map으로 반환
        return Map.of("list", boards, "count", totalCount);
    }

    public List<Board> getTopBoardsByViews() {

        List<Board> list = mapper.findTopBoardsByViews();
        List<Board> newList = new ArrayList<>();

        for (Board board : list) {
            List<String> fileNameList = mapper.selectFilesByBoardId(board.getNumber());
            List<BoardFile> fileSrcList = fileNameList.stream()
                    .map(name -> new BoardFile(name, imageSrcPrefix + "/BoardWriter/" + board.getWriter() + "/" + name)).toList();
            board.setFileList(fileSrcList);
            newList.add(board);
        }

        return newList;
    }


    public List<Board> getTopBoardsByLike() {
        List<Board> list = mapper.findTopBoardsByLike();
        List<Board> newList = new ArrayList<>();

        for (Board board : list) {
            List<String> fileNameList = mapper.selectFilesByBoardId(board.getNumber());
            List<BoardFile> fileSrcList = fileNameList.stream()
                    .map(name -> new BoardFile(name, imageSrcPrefix + "/BoardWriter/" + board.getWriter() + "/" + name))
                    .toList();

            board.setFileList(fileSrcList);

            newList.add(board);
        }
        return newList;
    }

    public Board get(int number) {
        Board board = mapper.selectById(number);
        KakaoMapAddress kakaoAddress = mapper.getKakaoAddress(number);
        board.setKakaoAddress(kakaoAddress);

        List<String> fileNameList = mapper.selectFilesByBoardId(number);
        List<BoardFile> fileSrcList = fileNameList
                .stream()
                .map(name -> new BoardFile(name, imageSrcPrefix + "/BoardWriter/" + board.getWriter() + "/" + name))
                .toList();
        board.setFileList(fileSrcList);
        return board;
    }

    public List<Board> getLikeCount() {
        return mapper.findLikeCount();
    }

    public void increaseViewCount(Integer number) {
        mapper.updateViewCount(number);
    }

    public boolean add(Board board, MultipartFile[] files, Authentication auth) {
        board.setWriter(auth.getName());

        int cnt = mapper.insert(board);

        if (files != null && files.length > 0) {

            //파일 업로드
            for (MultipartFile file : files) {
                String objectKey = "prj241126/BoardWriter/" + board.getWriter() + "/" + file.getOriginalFilename();
                PutObjectRequest por = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build();
                try {
                    s3.putObject(por, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }

                //board_file 테이블에 파일명 입력
                mapper.insertFile(board.getNumber(), file.getOriginalFilename());
            }
        }

        return cnt == 1;
    }

    public boolean validate(Board board) {
        boolean title = !board.getTitle().trim().isEmpty();
        boolean content = !board.getContent().trim().isEmpty();

        return title && content;
    }

    public boolean hasAccess(int number, Authentication auth) {
        Board board = mapper.selectById(number);
        return board.getWriter().equals(auth.getName());
    }

    public boolean remove(int number) {
        //댓글 지우기
        mapper.deleteCommentsByBoardId(number);

        //첨부파일, 실제파일(s3) 지우기
        List<String> fileName = mapper.selectFilesByBoardId(number);
        Board board = mapper.selectById(number);
        for (String file : fileName) {
            String key = "prj241126/BoardWriter/" + board.getWriter() + "/" + file;
            DeleteObjectRequest dor = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3.deleteObject(dor);
        }

        int cnt = mapper.deleteById(number);
        return cnt == 1;
    }


    public List<Announcement> mainBanner() {
        List<Announcement> list = mapper.selectAllAnn();
        List<Announcement> newList = new ArrayList<>();

        for (Announcement ann : list) {
            List<String> fileNameList = mapper.selectFilesByAnnIdBanner(ann.getId());
            List<AnnFile> fileSrcList = fileNameList.stream()
                    .map(name -> new AnnFile(name, imageSrcPrefix + "/Announcement/" + ann.getId() + "/" + name)).toList();
            ann.setFileList(fileSrcList);
            newList.add(ann);
        }

        return newList;
    }

    public Map<String, Object> listAnnouncement(Integer page) {

        return Map.of("list", mapper.selectAnnouncement((page - 1) * 10),
                "count", mapper.getAnnouncementCount());
    }

    public Map<String, Object> listQuestion(Integer page) {
        return Map.of("list", mapper.selectALlQuestion((page - 1) * 10),
                "count", mapper.getQuestionCount());
    }


    public boolean update(Board board, List<String> removeFiles, MultipartFile[] uploadFiles) {
        if (removeFiles != null) {
            for (String file : removeFiles) {
                String key = "prj241126/BoardWriter/" + board.getWriter() + "/" + file;
                DeleteObjectRequest dor = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build();

                // s3 파일 지우기
                s3.deleteObject(dor);

                // db 파일 지우기
                mapper.deleteFileByBoardIdAndName(board.getNumber(), file);
            }
        }

        if (uploadFiles != null && uploadFiles.length > 0) {
            for (MultipartFile file : uploadFiles) {
                String objectKey = "prj241126/BoardWriter/" + board.getWriter() + "/" + file.getOriginalFilename();
                PutObjectRequest por = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build();


                try {
                    s3.putObject(por, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }

                // board_file 테이블에 파일명 입력
                mapper.insertFile(board.getNumber(), file.getOriginalFilename());
            }
        }


        int cnt = mapper.update(board);
        return cnt == 1;
    }

    public void updateAddress(String addressName, Double addressLng, Double addressLat, int boardNumber) {
        mapper.updateKakaoAddr(addressName, addressLng, addressLat, boardNumber);
    }


    public Announcement getAnnView(int id) {
        Announcement announcement = mapper.selectByAnnId(id);
        List<String> fileNameList = mapper.selectFilesByAnnId(id);
        List<AnnFile> fileSrcList = fileNameList.stream()
                .map(name -> new AnnFile(name, imageSrcPrefix + "/Announcement/" + id + "/" + name)).toList();
        announcement.setFileList(fileSrcList);
        return announcement;
    }

    public boolean addAnn(Announcement announcement, Authentication auth, MultipartFile[] files) {
        announcement.setWriter(auth.getName());

        int cnt = mapper.insertAnn(announcement);

        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                String objectKey = "prj241126/Announcement/" + announcement.getId() + "/" + file.getOriginalFilename();
                PutObjectRequest por = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build();

                try {
                    s3.putObject(por, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
                //file 테이블에 파일명 입력
                mapper.insertAnnFile(announcement.getId(), file.getOriginalFilename());
            }
        }

        return cnt == 1;
    }

    public boolean validateQues(Question question) {
        boolean title = !question.getTitle().trim().isEmpty();
        boolean content = !question.getContent().trim().isEmpty();

        return title && content;
    }

    public boolean addQues(Question question, Authentication auth, MultipartFile[] files) {
        question.setWriter(auth.getName());

        int cnt = mapper.insertQues(question);

        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                String objectKey = "prj241126/Question/" + question.getId() + "/" + file.getOriginalFilename();
                PutObjectRequest por = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectKey)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build();

                try {
                    s3.putObject(por, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
                //file 테이블에 파일명 입력
                mapper.insertQuesFile(question.getId(), file.getOriginalFilename());
            }
        }

        return cnt == 1;
    }

    public Question getQuesView(int id) {
        Question question = mapper.selectByQuesId(id);
        List<String> fileNameList = mapper.selectFilesByQuesId(id);
        List<QuesFile> fileSrcList = fileNameList.stream()
                .map(name -> new QuesFile(name, imageSrcPrefix + "/Question/" + id + "/" + name)).toList();
        question.setFileList(fileSrcList);
        return question;
    }

    public boolean validateAnn(Announcement announcement) {
        boolean title = !announcement.getTitle().trim().isEmpty();
        boolean content = !announcement.getContent().trim().isEmpty();

        return title && content;
    }

    public boolean hasAccessAnn(Integer id, Authentication auth) {
        Announcement ann = mapper.selectByAnnId(id);
        return ann.getWriter().equals(auth.getName());
    }

    public boolean updateAnn(Announcement announcement, List<String> removeFiles, MultipartFile[] updateFiles) {

        System.out.println(announcement.getId());

        if (removeFiles != null) {
            for (String file : removeFiles) {
                String key = "prj241126/Announcement/" + announcement.getId() + "/" + file;
                DeleteObjectRequest dor = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build();
                s3.deleteObject(dor);
                mapper.deleteFileByAnnIdAndName(announcement.getId(), file);
            }
        }

        if (updateFiles != null && updateFiles.length > 0) {
            for (MultipartFile file : updateFiles) {
                String key = "prj241126/Announcement/" + announcement.getId() + "/" + file.getOriginalFilename();
                PutObjectRequest por = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build();

                try {
                    s3.putObject(por, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
                //file 테이블에 파일명 입력
                mapper.insertAnnFile(announcement.getId(), file.getOriginalFilename());
            }
        }

        int cnt = mapper.updateAnn(announcement);

        return cnt == 1;
    }

    public boolean removeAnn(int id) {
        //게시물 지우기전에
        //첨부파일 지우기

        //실제 파일(s3) 지우기
        //현재파일명 얻어오기
        List<String> fileName = mapper.selectFilesByAnnId(id);
        //서버에서 파일 지우기
        for (String file : fileName) {
            String key = "prj241126/Announcement/" + id + "/" + file;
            DeleteObjectRequest dor = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3.deleteObject(dor);
        }

        //db 에서 지우기
        mapper.deleteFileByAnnId(id);
        //게시글 지우기
        int cnt = mapper.deleteByAnnId(id);

        return cnt == 1;
    }

    public void insertAddress(String addressName, Double addressLng, Double addressLat, int boardNumber) {
        mapper.insertKakaoAddr(addressName, addressLng, addressLat, boardNumber);
    }


    public List<FishingAddress> selectFishingAddress() {
        System.out.println("잘됨");
        return mapper.selectFishAddress();
    }

    public List<Board> getBoardsByMemberId(String id) {
        return mapper.findBoardsByMemberId(id);
    }

    //조회수 증가 불러오기
    public int getViewCount(int number) {
        return mapper.selectViewCount(number);
    }

    public Map<String, Object> getLike(int number, Authentication auth) {
        boolean like = false;
        if (auth != null) {
            Map<String, Object> row = mapper.selectLikeByBoardIdAndMemberNumber(number, auth.getName());
            if (row != null) {
                like = true;
            }
        }
        int countLike = mapper.countLike(number);

        Map<String, Object> result = Map.of("like", like, "count", countLike);
        return result;
    }

    public Map<String, Object> like(Board board, Authentication authentication) {
        // 이미 좋아요면 삭제
        int cnt = mapper.deleteLikeByBoardIdAndMemberId(board.getNumber(), authentication.getName());
        // 아니면 삽입
        if (cnt == 0) {
            mapper.insertLike(board.getNumber(), authentication.getName());
        }

        int countLike = mapper.countLike(board.getNumber());

        Map<String, Object> result = Map.of("like", (cnt == 0), "count", countLike);

        return result;
    }


    public boolean updateQues(Question question, List<String> removeFiles, MultipartFile[] updateFiles) {

        if (removeFiles != null) {
            for (String file : removeFiles) {
                String key = "prj241126/Question/" + question.getId() + "/" + file;
                DeleteObjectRequest dor = DeleteObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .build();
                s3.deleteObject(dor);
                mapper.deleteFileByQuesIdAndName(question.getId(), file);
            }
        }

        if (updateFiles != null && updateFiles.length > 0) {
            for (MultipartFile file : updateFiles) {
                String key = "prj241126/Question/" + question.getId() + "/" + file.getOriginalFilename();
                PutObjectRequest por = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .acl(ObjectCannedACL.PUBLIC_READ)
                        .build();

                try {
                    s3.putObject(por, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
                } catch (IOException e) {
                    throw new RuntimeException(e);
                }
                //file 테이블에 파일명 입력
                mapper.insertQuesFile(question.getId(), file.getOriginalFilename());
            }
        }

        int cnt = mapper.updateQuestion(question);

        return cnt == 1;
    }

    public boolean hasAccessQues(Integer id, Authentication auth) {
        Question ann = mapper.selectByQuesId(id);
        return ann.getWriter().equals(auth.getName());
    }

    public boolean removeQues(int id) {
        //게시물 지우기전에
        //첨부파일 지우기

        //실제 파일(s3) 지우기
        //현재파일명 얻어오기
        List<String> fileName = mapper.selectFilesByQuesId(id);
        //서버에서 파일 지우기
        for (String file : fileName) {
            String key = "prj241126/Question/" + id + "/" + file;
            DeleteObjectRequest dor = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            s3.deleteObject(dor);
        }

        //db 에서 지우기
        mapper.deleteFileByQuesId(id);
        //댓글 대댓글 지우기
        questionCommentMapper.deleteByQuesIdChildComments(id);
        questionCommentMapper.deleteByQuesIdComments(id);
        //게시글 지우기
        int cnt = mapper.deleteByQuesId(id);

        return cnt == 1;
    }
}
