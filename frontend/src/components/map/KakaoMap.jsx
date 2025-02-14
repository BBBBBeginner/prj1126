import {
  Box,
  Flex,
  Group,
  HStack,
  IconButton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Field } from "../ui/field.jsx";
import { Button } from "../ui/button.jsx";
import {
  IoIosArrowDown,
  IoIosArrowForward,
  IoIosArrowUp,
} from "react-icons/io";
import axios from "axios";
import "../../components/css/kakaoMapStyle.css";
import { GiRiver } from "react-icons/gi";
import { FaList, FaShip } from "react-icons/fa6";
import { FaShareAlt } from "react-icons/fa";

const { kakao } = window;

const createInfoWindowContent = (type, data) => {
  if (type === "sharedFishing") {
    // 공유 낚시터일 때의 InfoWindow 내용
    return `
      <div class="info-window-header">
        <a href="/board/view/${data.number}" class="info-window-link">
          ${data.number} 번 게시글
        </a>
      </div>
      <div class="info-window-body">
        <b>${data.name}</b>
      </div>
    `;
  } else if (type === "searchResult") {
    // 검색된 장소일 때의 InfoWindow 내용
    return `
      <div class="info-window-header">
        <a href="${data.place_url}" target="_blank" class="info-window-link">
          ${data.place_name}
        </a>
      </div>
      <div class="info-window-body">
        ${data.address_name}
      </div>
    `;
  }
};

export function KakaoMap() {
  const [map, setMap] = useState(null);
  const [keyWord, setKeyWord] = useState(""); // 검색어
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchService, setSearchService] = useState(null); // 장소 검색 서비스
  const [markers, setMarkers] = useState([]); // 마커 관리
  const [infoWindows, setInfoWindows] = useState([]); // InfoWindow 관리
  const [places, setPlaces] = useState([]); // 검색 결과 데이터 저장
  const [addressList, setAddressList] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 지도 초기화
    const container = document.getElementById("map");
    const options = {
      center: new kakao.maps.LatLng(37.556535, 126.945108),
      level: 3,
    };
    const mapInstance = new kakao.maps.Map(container, options);
    // 장소 검색 초기화
    const ps = new kakao.maps.services.Places();

    setMap(mapInstance);
    setSearchService(ps);
  }, []);

  useEffect(() => {
    axios
      .get("/api/board/fishingAddress")
      .then((res) => res.data)
      .then((data) => {
        setAddressList(data);
      })
      .catch((e) => {
        console.log(e, "안됨");
      });
  }, []);

  function clearMarkersAndInfoWindows() {
    // 기존 마커 제거
    markers.forEach((marker) => marker.setMap(null));
    infoWindows.forEach((infoWindow) => infoWindow.close());
    setMarkers([]);
    setInfoWindows([]);
  }

  const handleShareFishingAddress = () => {
    setKeyWord("공유 낚시터"); // 키워드 설정
    setSearchOpen(true); // 목록 열기
    setPlaces(addressList);

    clearMarkersAndInfoWindows();

    if (addressList && addressList.length > 0) {
      const newMarkers = [];
      const newInfoWindows = [];
      const bounds = new kakao.maps.LatLngBounds();

      addressList.forEach((address) => {
        if (
          address.lat &&
          address.lng &&
          !isNaN(address.lat) &&
          !isNaN(address.lng)
        ) {
          const markerPosition = new kakao.maps.LatLng(
            address.lat,
            address.lng,
          );

          const marker = new kakao.maps.Marker({
            position: markerPosition,
            map: map,
          });
          newMarkers.push(marker);

          const infoWindowContent = createInfoWindowContent(
            "sharedFishing",
            address,
          );
          const infoWindowClose = true;

          const infoWindow = new kakao.maps.InfoWindow({
            content: infoWindowContent,
            removable: infoWindowClose,
          });
          newInfoWindows.push(infoWindow);

          kakao.maps.event.addListener(marker, "click", () => {
            newInfoWindows.forEach((iw) => iw.close());
            infoWindow.open(map, marker);
          });

          bounds.extend(markerPosition);
        } else {
          console.log("위치 데이터 없음", address);
        }
      });

      setMarkers(newMarkers);
      setInfoWindows(newInfoWindows);
      map.setBounds(bounds);
    } else {
      alert("공유 낚시터 데이터가 없습니다.");
    }
  };

  const handleClickButton = (searchKeyword) => {
    clearMarkersAndInfoWindows();

    searchService.keywordSearch(searchKeyword, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const bounds = new kakao.maps.LatLngBounds();
        const newMarkers = [];
        const newInfoWindows = [];

        data.forEach((place) => {
          const markerPosition = new kakao.maps.LatLng(place.y, place.x);
          const marker = new kakao.maps.Marker({
            position: markerPosition,
            map: map,
          });
          newMarkers.push(marker);

          const infoWindowContent = createInfoWindowContent(
            "searchResult",
            place,
          );
          const infoWindowClose = true;

          const infoWindow = new kakao.maps.InfoWindow({
            content: infoWindowContent,
            removable: infoWindowClose,
          });
          newInfoWindows.push(infoWindow);

          kakao.maps.event.addListener(marker, "click", () => {
            newInfoWindows.forEach((iw) => iw.close());
            infoWindow.open(map, marker);
          });

          bounds.extend(markerPosition);
        });

        setMarkers(newMarkers);
        setInfoWindows(newInfoWindows);
        setPlaces(data);
        map.setBounds(bounds);
        setKeyWord(searchKeyword);
        setSearchOpen(true);
      } else {
        alert("검색결과가 없습니다.");
      }
    });
  };

  const handlePlaceClick = (place, index) => {
    const targetPosition = new kakao.maps.LatLng(
      place.lat || place.y,
      place.lng || place.x,
    );

    map.setCenter(targetPosition);
    map.setLevel(3, { anchor: targetPosition });

    infoWindows.forEach((iw) => iw.close());
    infoWindows[index].open(map, markers[index]);
  };

  const handleOpenList = () => {
    if (searchOpen) {
      setSearchOpen(false);
      setKeyWord("");
    } else {
      setSearchOpen(true);
    }
  };
  console.log("Kakao API Key:", import.meta.env.VITE_KAKAOMAP_API_KEY);
  console.log("Weather API Key:", import.meta.env.VITE_WEATHER_API_KEY);

  return (
    <HStack
      position="relative" // 부모 컨테이너를 상대 위치로 설정
      mx="auto"
      w="70%"
      h="600px"
      bgColor="gray.100"
      borderRadius="md"
      boxShadow="md"
    >
      {/* 지도 */}
      <Box
        id="map"
        w="100%"
        h="100%"
        bgColor="white"
        borderRadius="md"
        boxShadow="md"
      ></Box>

      {isOpen ? (
        <Box position="absolute" top="10px" right="10px" zIndex="2">
          <Flex>
            <Button top="15px" bg={"red.500"} onClick={() => setIsOpen(false)}>
              <IoIosArrowForward />
            </Button>
            {/* 검색 및 목록 패널 */}
            <Stack
              w="470px" // 패널의 너비 설정
              maxH="90%" // 패널 높이 제한
              bgColor="rgba(255, 255, 255, 0.6)" // 투명도 적용
              borderRadius="md"
              boxShadow="lg"
              p={4}
            >
              {/* 검색 필드 */}
              <Field>
                <Group>
                  <Button
                    variant="subtle"
                    colorPalette={"blue"}
                    value={"민물 낚시"}
                    onClick={(e) => handleClickButton(e.target.value)}
                  >
                    <GiRiver />
                    전국 민물 낚시
                  </Button>
                  <Button
                    variant="subtle"
                    colorPalette={"blue"}
                    value={"배 낚시"}
                    onClick={(e) => handleClickButton(e.target.value)}
                  >
                    <FaShip />
                    전국 배 낚시
                  </Button>
                  <Button
                    variant="subtle"
                    colorPalette={"red"}
                    onClick={handleShareFishingAddress}
                  >
                    <FaShareAlt />
                    공유 낚시터
                  </Button>
                </Group>
              </Field>

              {/* 검색 결과 목록 */}
              {searchOpen && keyWord && (
                <Box
                  bgColor="rgba(255, 255, 255, 0.4)" // 검색 결과 목록 배경 투명도 설정
                  w="100%"
                  maxH="450px" /* 최대 높이 설정 */
                  overflowY="auto"
                  borderRadius="md"
                  p={2}
                >
                  <VStack spacing={2} align="stretch">
                    {places.map((place, index) => (
                      <Box
                        key={index}
                        p={4}
                        bgColor="rgba(255, 255, 255, 0.5)" // 개별 항목의 배경 투명도 설정
                        borderRadius="md"
                        boxShadow="sm"
                        cursor="pointer"
                        _hover={{ bgColor: "rgba(240, 240, 240, 0.9)" }} // hover 시 조금 더 진하게
                        onClick={() => handlePlaceClick(place, index)}
                      >
                        <Text fontSize="lg" fontWeight="bold">
                          {place.place_name || place.number + "번 게시글"}
                        </Text>
                        <Text fontSize="sm">
                          {place.address_name || place.name}
                        </Text>
                        {place.phone && (
                          <Text fontSize="sm" color="gray.600">
                            전화번호: {place.phone}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}

              {keyWord && (
                <IconButton w={"100%"} onClick={handleOpenList} h={"30px"}>
                  {searchOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
                </IconButton>
              )}
            </Stack>
          </Flex>
        </Box>
      ) : (
        <Button
          position="absolute"
          top="10px"
          right="10px"
          zIndex="2"
          onClick={() => setIsOpen(true)}
        >
          <FaList />
        </Button>
      )}
    </HStack>
  );
}
