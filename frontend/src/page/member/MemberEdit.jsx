import {
  Box,
  Button,
  Group,
  Heading,
  Input,
  Span,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { Field } from "../../components/ui/field.jsx";
import {
  DialogActionTrigger,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog.jsx";
import { toaster } from "../../components/ui/toaster.jsx";
import DaumPostcodeEmbed from "react-daum-postcode";
import { AuthenticationContext } from "../../context/AuthenticationProvider.jsx";

export function MemberEdit() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [post, setPost] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { hasAccess } = useContext(AuthenticationContext);

  useEffect(() => {
    axios.get(`/api/member/${id}`).then((res) => {
      setMember(res.data);
      setPassword(res.data.password);
      setPost(res.data.post);
      setPhone(res.data.phone);
      setAddress(res.data.address);
      setEmail(res.data.email);
    });
  }, []);

  function handleSaveClick() {
    axios
      .put("/api/member/update", {
        id: member.id,
        password,
        post,
        address,
        email,
        oldPassword,
        phone,
      })
      .then((res) => {
        const message = res.data.message;

        toaster.create({
          type: message.type,
          description: message.text,
        });
        navigate(`/member/${id}`);
      })
      .catch((e) => {
        const message = e.response.data.message;

        toaster.create({
          type: message.type,
          description: message.text,
        });
      })
      .finally(() => {
        setOpen(false);
        setOldPassword("");
      });
  }

  if (member === null) {
    return <Spinner />;
  }

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    const emailRegex =
      /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{3}$/i;

    if (!emailRegex.test(value)) {
      setEmailError(false);
      setEmailMessage("유효하지 않은 이메일 형식입니다");
    } else {
      setEmailError(true);
      setEmailMessage("올바른 이메일 형식입니다.");
    }
  };

  function regPhoneNumber(e) {
    const result = e.target.value
      .replace(/[^0-9.]/g, "")
      .replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3")
      .replace(/(-{1,2})$/g, "");
    setPhone(result);
  }

  const handleApi = () => {
    setIsOpen(true);
  };
  const handleComplete = (e) => {
    const { address, zonecode } = e;
    setPost(zonecode);
    setAddress(address);
  };
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Box
      px={{ base: "10px", md: "20px" }}
      mx="auto"
      w={{ base: "95%", md: "70%", lg: "50%" }}
    >
      <Heading
        textAlign="center"
        fontSize={{ base: "20px", md: "24px", lg: "28px" }}
        mb={5}
      >
        내 정보 수정
      </Heading>
      {hasAccess(member.id) && (
        <Stack gap={5} p={5} bg="blue.200" borderRadius="md">
          <Field label={"아이디"}>
            <Input readOnly value={member.id} style={{ color: "gray" }} />
          </Field>
          <Field label={"암호"}>
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label={"이름"}>
            <Input readOnly value={member.name} style={{ color: "gray" }} />
          </Field>
          <Field label={"이메일"}>
            <Input value={email} onChange={handleEmailChange} />
            <Span style={{ color: emailError ? "green" : "red" }}>
              {emailMessage}
            </Span>
          </Field>
          <Field label={"전화번호"}>
            <Input value={phone} onChange={regPhoneNumber} />
          </Field>
          <Field label={"생일"}>
            <Input readOnly value={member.birth} style={{ color: "gray" }} />
          </Field>
          <Box>
            <Field label={"우편번호"}>
              <Group>
                <Input value={post} readOnly />
                <Button onClick={handleApi}>우편번호 찾기</Button>
              </Group>
            </Field>
            {isOpen && (
              <Box mt={3}>
                <DaumPostcodeEmbed
                  onComplete={handleComplete}
                  onClose={handleClose}
                />
                <Button mt={2} onClick={handleClose}>
                  닫기
                </Button>
              </Box>
            )}
            <Field label={"상세주소"}>
              <Input value={address} readOnly />
            </Field>
          </Box>
          <Field label={"가입일시"}>
            <Input readOnly value={member.inserted} style={{ color: "gray" }} />
          </Field>
          <Box textAlign="center">
            <DialogRoot open={open} onOpenChange={(e) => setOpen(e.open)}>
              <DialogTrigger asChild>
                <Button
                  w={{ base: "100%", md: "auto" }}
                  colorScheme="blue"
                  mt={4}
                >
                  저장
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>회원 정보 변경 확인</DialogTitle>
                </DialogHeader>
                <DialogBody>
                  <Stack gap={5}>
                    <Field label={"기존 암호"}>
                      <Input
                        placeholder={"기존 암호를 입력해주세요."}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                    </Field>
                  </Stack>
                </DialogBody>
                <DialogFooter>
                  <DialogActionTrigger>
                    <Button variant={"outline"}>취소</Button>
                  </DialogActionTrigger>
                  <Button colorScheme="blue" onClick={handleSaveClick}>
                    저장
                  </Button>
                </DialogFooter>
              </DialogContent>
            </DialogRoot>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
